import {Resource} from "../../Requirements";
import Util from "../../Util";
import Default from "./../Default";
import Configuration from "../../Configuration";
import LayerConfig, {LayerConfigItem} from "../../Config/LayerConfig";
import path from "node:path";
import {MethodInfo} from "../../Collector/SprykerCollector";

export default class Model extends Default {
    private layerItem: LayerConfigItem;

    constructor(config:Configuration, layerConfig: LayerConfig, layerItem: LayerConfigItem, relativePath:string) {
        super(config, layerConfig, relativePath)
        this.layerItem = layerItem;
    }

    process = (resourceConfig: Resource): string => {
        return this.processPlaceHolders(this.generatePhpClass(resourceConfig), resourceConfig)
    }

    generatePhpClass = (resourceConfig: Resource): string => {
        let file = this.processPlaceHolders(resourceConfig.name, resourceConfig)

        const namespace = Util.getNamespace(path.dirname(Util.buildPath([this.relativePath, file])));
        let targetClass = String(file.split(path.sep).pop())?.replace('.php', '')
        const className = `${targetClass} implements ${targetClass}Interface`;

        let classCode = `<?php\n\n`;

        classCode += `namespace ${namespace};\n\n`;

        classCode += `\nclass ${className}\n{\n`;
        // classCode += `    public function get(): void \n    {\n`;
        // classCode += `        \n`;
        // classCode += `    }\n`;
        classCode += `}\n`;

        return classCode;
    };
}