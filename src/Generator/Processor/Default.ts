import Configuration from "../Configuration";
import {Resource} from "../Requirements";
import LayerConfig from "../Config/LayerConfig";
import Util from "../Util";
import _ from "lodash";

export type ResourcePlaceholder = {
    name: string,
    alias?: string,
    skip?: boolean,
    transform?: string[]
}

export const transformerHandlers = {
    toLower: _.toLower,
    upperFirst: _.upperFirst,
    lowerFirst: _.lowerFirst,
    snakeCase: _.snakeCase,
    lowerCase: _.lowerCase,
    camelCase: _.camelCase,
    kebabCase: _.kebabCase,
    toModelName: (value: string, config: Configuration) => {
        return value.replace(config.getModuleName(), '').replace('Plugin', '')
    },
    dropSuffixInterface: (value: string) => value.replace(/Interface/g, '')
};

export default abstract class Default {
    protected readonly layerConfig: LayerConfig;
    protected readonly config: Configuration;
    protected readonly relativePath: string;

    constructor(config:Configuration, layerConfig: LayerConfig, relativePath:string) {
        this.config = config;
        this.layerConfig = layerConfig;
        this.relativePath = relativePath;
    }

    abstract process(resourceConfig: Resource): string

    protected processPlaceholder = (targetValue: string, placeholder: ResourcePlaceholder, config: Configuration|LayerConfig): string => {
        let placeholderValueAlias: string = typeof placeholder === "object" ? (placeholder?.alias?.length ? placeholder.alias : placeholder.name) : placeholder
        let placeholderValue: string = typeof placeholder === "object" ? placeholder.name : placeholder
        let placeholderTransformers = this.getTransformerHandler(placeholder?.transform ?? [])

        let targetMethod = `get${placeholderValueAlias}`
        const regex = new RegExp(`\\[${placeholderValue}\\]`, 'g')

        //@ts-ignore
        if (targetMethod in config && typeof config[targetMethod] === 'function') {
            //@ts-ignore
            targetValue = targetValue.replace(regex, this.transformPlaceholder(config[targetMethod](), placeholderTransformers))
        }

        targetMethod = `get${_.upperFirst(placeholderValueAlias)}`

        //@ts-ignore
        if (targetMethod in config && typeof config[targetMethod] === 'function') {
            //@ts-ignore
            targetValue = targetValue.replace(regex, this.transformPlaceholder(config[targetMethod](), placeholderTransformers))
        }

        let proxy = config?.createProxy()

        if (proxy && proxy[placeholderValueAlias]) {
            let value = proxy[placeholderValueAlias]
            if (typeof value === "object" && !Array.isArray(value)) {
                value = value?.derivedClassName ? value?.derivedClassName : value?.module
            }
            //@ts-ignore
            targetValue = targetValue.replace(regex, this.transformPlaceholder(value, placeholderTransformers))
        }

        //@ts-ignore
        if (targetMethod in Util) {
            // @ts-ignore
            targetValue = targetValue.replace(regex, this.transformPlaceholder(Util[targetMethod](this.relativePath), placeholderTransformers))
        }

        return targetValue
    }

    protected processPlaceHolders = (content: string, resourceConfig: Resource) => {
        resourceConfig?.placeholder?.map((placeholder: ResourcePlaceholder) => {
            content = this.processPlaceholder(content, placeholder, this.config)
            content = this.processPlaceholder(content, placeholder, this.layerConfig)
        })

        return content
    }

    protected transformPlaceholder = (placeholderValue:string, handlers: any[]) => {
        handlers.map((handler: any) => {
            if (handler.length === 2) {
                placeholderValue = handler(placeholderValue, this.config)
            } else {
                placeholderValue = handler(placeholderValue)
            }

        })

        return placeholderValue
    }

    protected getTransformerHandler = (targetHandlers: string[]): any[] => {
        let handlers: any[] = []

        targetHandlers.map((handler:any) => {
            //@ts-ignore
            handlers.push(typeof transformerHandlers[handler] === 'function' ? transformerHandlers[handler] : _.upperFirst)
        })

        return handlers.length ? handlers : [_.upperFirst]
    }
}