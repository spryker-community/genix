import {Resource} from "../Requirements";
import Default, {ResourcePlaceholder} from "./Default";
import {existsSync} from "node:fs";
import Util from "../Util";
import {readFileSync} from "fs";
import fs from "fs";

export default class Content extends Default {

    process = (resourceConfig: Resource): string => {
        return this.processPlaceHolders(this.getTemplateContent(resourceConfig?.template ?? '', resourceConfig), resourceConfig)
    }

    getTemplateContent = (path: string, resourceConfig: Resource): string => {
        path = this.processPlaceHolders(path, resourceConfig)
        if (!existsSync(path)) {
            path = Util.buildPath([Util.getSrcFolder(), path])
        }

        if (!existsSync(path)) {
            return ''
        }

        const stats = fs.statSync(path);

        if (stats.isDirectory()) {
            return ''
        }

        return readFileSync(path).toString('utf-8')
    }
}