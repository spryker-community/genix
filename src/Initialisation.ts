import chalk from "chalk";
import figlet from "figlet";
import Environment from "./Env/Environment";
import Requirements from "./Generator/Requirements";
import {existsSync} from "node:fs";
import AppConfig from "./Generator/Processor/AppConfig";
import inquirer from "inquirer";
import Questions from "./Generator/Questions";
import Configuration from "./Env/Configuration";
import fs from "fs";
import path from "path";
import Util from "./Generator/Util";

export default class Initialisation {
    private readonly pathToAppConfig: string;

    constructor(pathToAppConfig: string) {
        this.pathToAppConfig = pathToAppConfig;
    }


    process  = async (): Promise<Environment> => {
        if (!this.isInitialised()) {
            let projectList = this.getProjectsList()
            let project:any = await inquirer.prompt({
                type: 'list',
                name: 'value',
                //@ts-ignore
                message: 'Please select project you would like to use as active:',
                choices: Object.keys(projectList).map((key:string) => {
                    return {
                        name: key,
                        value: key
                    }
                })
            })

            let vendor:any = await inquirer.prompt({
                type: 'input',
                name: 'value',
                //@ts-ignore
                message: 'What is the target vendor name?',
            })

            let githubKey:any = this.askForAccessToken()

            new AppConfig(this.pathToAppConfig).process(project.value, vendor.value, githubKey.value)
        }

        return this.getEnvironment()
    }

    public askForAccessToken = async ():Promise<any> => {
        return inquirer.prompt({
            type: 'password',
            name: 'value',
            //@ts-ignore
            message: 'Please provide GitHubKey for streamline integration'
        })
    }

    private getProjectsList = () => {
        const files = fs.readdirSync(Util.getProjectsFolder());

        return files.filter((file: string) => {
            const filePath = path.join(Util.getProjectsFolder(), file);
            const stats = fs.statSync(filePath);
            return stats.isDirectory();
        }).map((file:string) => {
            return {
                name: file,
                value: Object.fromEntries([[file, path.join(Util.getProjectsFolder(), file)]])
            }
        });
    }

    private isDockerContainer = ():boolean => {
        return Boolean(process.env?.IS_DOCKER)
    }

    private getEnvironment = ():Environment => {
        let builder: Configuration = new Configuration(this.pathToAppConfig)
        builder.load()
        return new Environment(builder, this.isDockerContainer())
    }

    private isInitialised = ():boolean => {
        return existsSync(this.pathToAppConfig)
    }
}