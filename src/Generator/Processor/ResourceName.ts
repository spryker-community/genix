import {Resource} from "../Requirements";
import Default, {ResourcePlaceholder} from "./Default";

export default class ResourceName extends Default {

    process = (resourceConfig: Resource): string => {
        let result = resourceConfig.name

        resourceConfig?.placeholder?.map((placeholder: ResourcePlaceholder) => {
            result = this.processPlaceholder(result, placeholder, this.config)
            result = this.processPlaceholder(result, placeholder, this.layerConfig)
        })

        return result
    }
}