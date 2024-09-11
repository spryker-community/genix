import {Resource} from "../../Requirements";
import Util from "../../Util";
import Default from "./../Default";
import Configuration from "../../Configuration";
import LayerConfig, {LayerConfigItem} from "../../Config/LayerConfig";
import path from "node:path";
import {MethodInfo} from "../../Collector/SprykerCollector";

interface MethodParam {
    name: string;
    type: string;
}

interface Method {
    method: string;
    deprecated: boolean;
    params: MethodParam[];
    returnType: string;
}

interface PhpInterfaceData {
    name: string;
    namespace: string;
    deprecated: boolean;
    registrationMethod: string;
    derivedClassName: string,
    isPlugin: boolean,
    projectLevelRegistrationClass: string,
    registrationClass: string,
    module: string,
    relativePath: string,
    methods: MethodInfo[];
    uses: string[];
    targetNamespace?: string;
    targetModule?: string;
}

export default class Plugin extends Default {
    private layerItem: LayerConfigItem;
    private interfaceData: PhpInterfaceData

    constructor(config:Configuration, layerConfig: LayerConfig, layerItem: LayerConfigItem, relativePath:string) {
        super(config, layerConfig, relativePath)
        this.layerItem = layerItem;
        //@ts-ignore
        this.interfaceData = this.layerItem.value as PhpInterfaceData;
    }

    process = (resourceConfig: Resource): string => {
        return this.processPlaceHolders(this.generatePhpClass(resourceConfig), resourceConfig)
    }

    generatePhpClass = (resourceConfig: Resource): string => {
        let file = this.processPlaceHolders(resourceConfig.name, resourceConfig)
        const moduleName = this.config.getModuleName()
        const namespace = Util.getNamespace(path.dirname(Util.buildPath([this.relativePath, file])));
        const interfaceName = this.interfaceData.name.trimEnd();
        const isDeprecated = this.interfaceData.deprecated;
        let abstractPlugin = this.interfaceData.isPlugin ? ' extends AbstractPlugin ' : ''

        this.interfaceData.targetNamespace = namespace;
        //@TODO fix and make it generic
        this.interfaceData.targetModule = this.layerConfig.getByKey('communicationPluginConsumerModule')?.module;

        this.config.add('registration', this.interfaceData.derivedClassName, this.interfaceData)

        const className = `${moduleName}${this.interfaceData.derivedClassName}${abstractPlugin}implements ${interfaceName}`;

        let classCode = `<?php\n\n`;

        classCode += `namespace ${namespace};\n\n`;
        classCode += `use ${this.interfaceData.namespace.replace(/\\\\/g, '\\')}\\${interfaceName};\n`;
        classCode += `use Spryker\\Zed\\Kernel\\Communication\\AbstractPlugin;\n`;

        this.interfaceData.uses.forEach((use) => {
            classCode += `use ${use};\n`;
        });

        if (isDeprecated) {
            classCode += `/**\n * @deprecated\n */\n`;
        }

        classCode += `\nclass ${className} \n{\n`;

        this.interfaceData.methods.forEach((method:any) => {
            if (method.deprecated) {
                classCode += `    /**\n     * @deprecated\n     */\n`;
            }

            const params = method.params.map((param:any) => `${param.type} $${param.name}`).join(', ');
            classCode += this.generateDockBlock(method)

            classCode += `    public function ${method.method}(${params}): ${method.returnType}\n    {\n`;
            // classCode += `         throw new \Error('Method ${method.method}() require implementation.'); \n`;
            classCode += `        return $${method.params[0].name}; \n`;
            classCode += `    }\n`;
        });

        classCode += `}\n`;

        return classCode;
    };

    generateDockBlock = (method: Method):string => {
        return [
            '    /**',
            ...method.params.map((param:any) => {
                let type =  param.type === 'array' ? 'array<array<string, mixed>>' : param.type

                return `     * @param ${type} $${param.name}`
            }),
            '     *',
            `     * @return ${method.returnType === 'array' ? 'array<array<string, mixed>>' : method.returnType} `,
            '    */',
            ''
        ].join("\n")
    }
}