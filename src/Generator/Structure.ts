import Configuration from "./Configuration";
import chalk from "chalk";
import {writeFileSync} from "node:fs";
import {mkdirSync} from "fs";
import _ from "lodash";
import Util from "./Util";
import LayerConfig, {LayerConfigItem} from "./Config/LayerConfig";
import {Resource} from "./Requirements";
import ResourceName from "./Processor/ResourceName";
import * as path from 'path';
import Content from "./Processor/Content";
import Php from "./Processor/Php/Php";

export default class Structure {
    protected requirements: Configuration;

    constructor(requirements: Configuration) {
        this.requirements = requirements;
    }

    process = async (): Promise<boolean> => {
        for (let layer of this.requirements.getLayers()) {
            if (['dependencies', 'integration'].some((target: string) => target === layer.getLayer())) {
                continue;
            }
            [...layer.get().values()].map(async (item: LayerConfigItem) => await this.processLayerItem(layer, item))
        }

        return true
    }

    private collectDependencies = (layerItem: LayerConfigItem) => {
        if (['communicationPluginConsumerModule'].some((target: string) => target === layerItem.key)) {
            this.requirements.add('dependencies', layerItem.value, layerItem.value)
        }
    }

    private processLayerItem = async (layer: LayerConfig, layerItem: LayerConfigItem) => {
        this.collectDependencies(layerItem)
        await this.create(
            layer,
            layerItem,
            [
                this.requirements.getModuleFolder(),
                layer.isDefault() ? '' : 'src',
                layer.isDefault() ? '' : this.requirements.getOrganisation(),
                layer.isDefault() ? '' : _.upperFirst(layer.getLayer()),
                layer.isDefault() ? '' : this.requirements.getModuleName(),
            ].filter((el: string) => el.length > 0).join(path.sep),
            layerItem.files ?? []
        )
    }

    private create = async (layerConfig: LayerConfig, layerItem: LayerConfigItem, relativeDirNamePath: string | null, resources: Resource[]) => {
        let fullPath = [Util.getProjectRootFolder(), relativeDirNamePath].join(path.sep)

        try {
            resources.map(async (el: Resource) => {
                if (el?.skip) {
                    return el
                }
                let resourcePath = [fullPath, new ResourceName(this.requirements, layerConfig, relativeDirNamePath ?? '').process(el)].join(path.sep)
                const dir = path.dirname(resourcePath);
                mkdirSync(dir, {recursive: true});
                let content: string = ''

                if (el.type === 'file') {
                    if (el?.processor) {
                        //@ts-ignore
                        const handler = await import(el?.processor);
                        const ProcessorClass: any = handler.default;
                        try {
                            let processorInstance;
                            if (el.processor.includes('/Php')) {
                                processorInstance = new ProcessorClass(this.requirements, layerConfig, layerItem, relativeDirNamePath ?? '');
                            } else {
                                processorInstance = new ProcessorClass(this.requirements, layerConfig, relativeDirNamePath ?? '');
                            }

                            content = await processorInstance.process(el)
                        } catch (error) {
                            console.error(error)
                        }
                    } else if (typeof layerItem.value === "object" && !Array.isArray(layerItem.value)) {
                        content = new Php(this.requirements, layerConfig, layerItem, relativeDirNamePath ?? '').process(el)
                    } else {
                        content = new Content(this.requirements, layerConfig, relativeDirNamePath ?? '').process(el)
                    }

                    writeFileSync(resourcePath, content, 'utf8');
                } else {
                    mkdirSync(Util.buildPath([fullPath, el.name]), {recursive: true});
                }
            })
        } catch (e: any) {
            console.error(e)
        }
    }
}