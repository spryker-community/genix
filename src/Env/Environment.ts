import Configuration from "./Configuration";
import Util from "../Generator/Util";
import {Choice} from "../Generator/Requirements";
import fs from "fs";
import path from "path";
import * as glob from 'glob';

export default class Environment {
    private readonly standalone: boolean;
    private readonly envConfig: Configuration;

    constructor(envConfig: Configuration, standalone: boolean) {
        this.envConfig = envConfig;
        this.standalone = standalone;
    }

    isStandalone = (): boolean => {
        return this.standalone
    }

    getConfig = ():Configuration => {
        return this.envConfig
    }

    getCurrentEnv = () => {
        return this.envConfig.getProject()
    }

    getProjectDirectory = (): string => {
        return Util.getProjectsFolder()
    }

    adjustOutputPath = (path: string): string => {
        return path.replace('PROJECT', this.getCurrentEnv())
    }

    getModuleList = (): Choice[] => {
        //@ts-ignore
        return glob.sync(`${Util.getModulesFolder()}/*/*/`, { cache: { DIR: false }, nodir: false}).map((file:string) => {
            let module:string = file.split(path.sep).pop() ?? file
            return {
                name: module,
                value: Object.fromEntries([[module, file]])
            }
        });
    }

    getProjectList = (): Choice[] => {
        const files = fs.readdirSync(this.getProjectDirectory());

        return files.filter((file: string) => {
            const filePath = path.join(this.getProjectDirectory(), file);
            const stats = fs.statSync(filePath);
            return stats.isDirectory();
        }).map((file:string) => {
            return {
                name: file,
                value: Object.fromEntries([[file, path.join(this.getProjectDirectory(), file)]])
            }
        });
    }

    getPathToCurrentEnv = () => {
        return Util.buildPath([Util.getProjectsFolder(), this.envConfig.getProject()])
    }
}