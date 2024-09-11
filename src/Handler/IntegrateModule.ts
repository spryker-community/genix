import Environment from "../Env/Environment";
import Configuration from "../Generator/Configuration";
import Cli from "../Generator/Cli";
import inquirer from "inquirer";
import {Choice} from "../Generator/Requirements";
import Util from "../Generator/Util";
import {existsSync} from "node:fs";
import ComposerJson from "../Generator/ComposerJson";
import IntegrationConfig from "../Integrator/IntegrationConfig";
import * as yaml from 'yaml';
import {readFileSync} from "fs";

export default class IntegrateModule {
    private env: Environment;

    constructor(env: Environment) {
        this.env = env;
    }

    public process = async (): Promise<boolean> => {
        let modulesList = this.env.getModuleList()
        let answer:any = await inquirer.prompt(
            {
                type: 'list',
                name: 'value',
                //@ts-ignore
                message: 'Please chose module you would like to integrate into active project',
                choices: modulesList.map((choice:Choice) => {
                    return {
                        name: choice.name,
                        value: choice.value
                    }
                })
            }
        )

        let pathToPhpIntegrator: string = Util.buildPath([Util.getProjectRootFolder(), 'src/Php/src/Integrator.php'])
        let pathToModule: string = <string>Object.values(answer.value).pop() ?? ''
        if (!existsSync(pathToModule)) {
            console.warn(`Module folder not found, so integration skipped. ${pathToModule}`)
            return true
        }
        await this.updateComposer(pathToModule)

        return await (new Cli(`php `, [`${pathToPhpIntegrator}`, '-t', `${pathToModule}`])).process(true, false)
    }

    private updateComposer = async (pathToModule: string):Promise<void> => {
        let pathToComposer: string = Util.buildPath([this.env.getProjectDirectory(), this.env.getCurrentEnv(), 'composer.json'])
        let pathToProject: string = Util.buildPath([this.env.getProjectDirectory(), this.env.getCurrentEnv()])
        let pathToIntegrationFile: string = Util.buildPath([pathToModule, IntegrationConfig.integrationFileName])

        if (!existsSync(pathToIntegrationFile)) {
            console.warn(`Integration impossible because integration file is missed: ${pathToIntegrationFile}`)
            return
        }

        if (!existsSync(pathToComposer)) {
            console.warn(`Integration impossible because composer could not be found: ${pathToComposer}`)
            return
        }
        let config = yaml.parse(readFileSync(pathToIntegrationFile, 'utf-8'))
        console.log(config.repository)

        let builder:ComposerJson = new ComposerJson()
        builder
            .load(pathToComposer)
            .addRepository(config.repository.handler, config.repository.repo)

        await builder.save(pathToComposer)
    }
}