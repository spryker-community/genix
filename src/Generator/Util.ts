import Configuration from "./Configuration";
import path from "node:path";
import {Resource} from "./Requirements";
import _ from "lodash";

export default class Util {
    public static FOLDER_SRC = 'src'

    public static getProjectRootFolder() {
        return process.env.NODE_WORKING_DIR ? process.env.NODE_WORKING_DIR : process.cwd()
    }

    public static getProjectsFolder() {
        return  process.env.NODE_WORKING_DIR ? '/projects' : process.env.PROJECTS_DIRECTORY ?? '/Users/eduardmelnytskyi/projects/excite'
    }

    public static getAppConfigPath() {
        return Util.buildPath([Util.getProjectRootFolder(), '.config.json'])
    }

    public static getSprykFolder() {
        return Util.buildPath([Util.getProjectRootFolder(), 'spryk'])
    }

    public static getModulesFolder() {
        return Util.buildPath([Util.getProjectRootFolder(), 'modules'])
    }

    public static getModuleFolder(config: Configuration) {
        // return Util.buildPath([Util.getSprykFolder(), 'modules', config.getVendor(), config.getModuleName()])
        return Util.buildPath([Util.getProjectRootFolder(), 'modules', config.getVendor(), config.getModuleName()])
    }

    public static getRepoNameWithOrganisation(config: Configuration) {
        return Util.buildPath([config.getVendor(), config.getModuleName()])
    }

    public static getSrcFolder = () => {
        return Util.buildPath([Util.getProjectRootFolder(), Util.FOLDER_SRC])
    }

    public static buildPath = (args:string[]): string => {
        return args.join(path.sep)
    }

    public static getNamespace = (pathToFile: string): string => {
        return _.trimEnd(pathToFile?.split(`src${path.sep}`)?.pop()?.replace(new RegExp(path.sep, 'g'), '\\') ?? '', '\\')
    }
}