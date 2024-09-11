import {Resource} from "../Requirements";
import _ from "lodash";

export type LayerConfigItem = {
    key: string,
    value: any,
    files?: Resource[],
}

export default class LayerConfig {
    private storage: Map<string, LayerConfigItem> = new Map<string, LayerConfigItem>()
    private readonly layer: string;
    public static KEY_CONFIG_DEFAULT = 'default'

    constructor(layer:string) {
        this.layer = layer;
    }

    getLayer = ():string => {
        return this.layer
    }

    add = (key: string, value: string, files:Resource[] = []): LayerConfig => {
        if (this.storage.has(key)) {
            if (Array.isArray(this.storage.get(key)?.value)) {
                //@ts-ignore
                this.storage.get(key)?.value?.push(value)
            } else {
                //@ts-ignore
                this.storage.get(key).value = value
            }

            this.storage.get(key)?.files?.push(...files)
            return this
        }
        this.storage.set(key, {
            key: key,
            value: value,
            files: files
        })
        return this
    }

    isDefault = (): boolean => {
        return this.layer === LayerConfig.KEY_CONFIG_DEFAULT
    }

    get = (): Map<string, LayerConfigItem> => {
        return this.storage
    }

    getByKey = (key:string, defaultValue:any = ''): any => {
        return this.storage.get(key)?.value ?? defaultValue
    }

    createProxy = (): any => {
        return new Proxy(this, {
            get: (target, prop: string) => {
                if (target.storage.has(prop)) {
                    return target.storage.get(prop)?.value;
                } else {
                    return null;
                }
            }
        });
    }
}