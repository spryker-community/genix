import _ from "lodash";
import LayerConfig from "./Config/LayerConfig";
import {Resource} from "./Requirements";
import Util from "./Util";

export default class Configuration {
    [key: string]: any;

    private layerConfigs: Map<string, LayerConfig> = new Map<string, LayerConfig>();

    add = (layer: string, key: string, value: any, files: Resource[] = []): void => {
        let targetValue = value

        if (typeof value === "object" && key in value && value[key]) {
            targetValue = value[key]
        }

        this.getLayerConfig(layer).add(key, targetValue, files)
    }

    getVendor = (): string => {
        // return _.upperFirst((_.camelCase(this.get('targetVendor', 'DemoVendor'))))
        return _.kebabCase(this.getLayerConfig(LayerConfig.KEY_CONFIG_DEFAULT).getByKey('targetVendor', 'Demo Vendor'))
    }

    getNameSpace = (): string => {
        return [
            this.getOrganisation(),
            this.getModuleName()
        ].join('\\')
    }

    getOrganisation = (): string => {
        return _.upperFirst((_.camelCase(this.getLayerConfig(LayerConfig.KEY_CONFIG_DEFAULT).getByKey('targetVendor', 'Demo Vendor'))))
    }

    getLicenceOrganisation = (): string => {
        return _.upperFirst((this.getLayerConfig(LayerConfig.KEY_CONFIG_DEFAULT).getByKey('targetVendor', 'Demo Vendor')))
    }

    getTargetLicense = (): string => {
        return _.upperCase((this.getLayerConfig(LayerConfig.KEY_CONFIG_DEFAULT).getByKey('targetLicense', 'MIT')))
    }

    getModuleDescription = (): string => {
        return this.getLayerConfig(LayerConfig.KEY_CONFIG_DEFAULT).getByKey('moduleDescription', 'PUT MODULE DESCRIPTION HERE')
    }

    getYear = (): number => {
        return new Date().getFullYear()
    }

    getModuleName = (): string => {
        return _.upperFirst((_.camelCase(this.getLayerConfig(LayerConfig.KEY_CONFIG_DEFAULT).getByKey('moduleName', 'Test Module'))))
    }

    getRepoName = (): string => {
        return _.kebabCase(this.getLayerConfig(LayerConfig.KEY_CONFIG_DEFAULT).getByKey('moduleName', 'Test Module')).toLowerCase()
    }

    getIsRepoPrivate = (): boolean => {
        return Boolean(this.getLayerConfig(LayerConfig.KEY_CONFIG_DEFAULT).getByKey('privateRepo', false))
    }

    getIsGitHubPro = (): boolean => {
        return Boolean(this.getLayerConfig(LayerConfig.KEY_CONFIG_DEFAULT).getByKey('githubPro', false))
    }

    getComposerName = (): string => {
        return `${this.getVendor()}/${this.getRepoName()}`
    }

    getLayers = (): LayerConfig[] => {
        return this.getLayerConfigs()
    }

    getLayerDependency = (layerName: string): string[] => {
        return this.get(`${layerName}_dependency`, [])
    }

    getLayerConfig = (layer: string): LayerConfig => {
        layer = typeof layer === "undefined" ? 'default' : layer

        if (!this.layerConfigs.has(layer)) {
            this.layerConfigs.set(layer, new LayerConfig(layer))
        }
        //@ts-ignore
        return this.layerConfigs.get(layer)
    }

    getDefaultLayerConfig = (): LayerConfig => {
        return this.getLayerConfig(LayerConfig.KEY_CONFIG_DEFAULT)
    }

    getOutputFolder = (): string => {
        let res: string | null = this.getLayerConfig(LayerConfig.KEY_CONFIG_DEFAULT).getByKey('outputFolder')
        if (!res) {
            res = '/modules'
        }
        return res
    }

    getLayerConfigs = (): LayerConfig[] => {
        return [...this.layerConfigs.values()]
    }

    getModuleFolder = (): string => {
        return Util.buildPath(
            [
                this.getOutputFolder(),
                this.getVendor(),
                this.getModuleName()
            ]
        )
    }

    getModuleFullPath = (): string => {
        return Util.buildPath(
            [
                Util.getProjectRootFolder(),
                this.getModuleFolder()
            ]
        )
    }

    createProxy = (): any => {
        return new Proxy(this, {
            get: (target, prop: string) => {
                if (target.layerConfigs.has(prop)) {
                    return target.layerConfigs.get(prop);
                } else {
                    return null;
                }
            }
        });
    }
}