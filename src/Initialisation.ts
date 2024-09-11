import chalk from "chalk";
import figlet from "figlet";
import Environment from "./Env/Environment";
import Requirements from "./Generator/Requirements";
import {existsSync} from "node:fs";
import AppConfig from "./Generator/Processor/AppConfig";
import inquirer from "inquirer";
import Questions from "./Generator/Questions";
import Configuration from "./Env/Configuration";

export default class Initialisation {
    private readonly pathToAppConfig: string;

    constructor(pathToAppConfig: string) {
        this.pathToAppConfig = pathToAppConfig;
    }

    process  = async (): Promise<Environment> => {
        if (!this.isInitialised()) {
            let project:any = await inquirer.prompt({
                type: 'list',
                name: 'value',
                //@ts-ignore
                message: 'Please select project you would like to use as active:',
                choices: [
                    'test'
                ]
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