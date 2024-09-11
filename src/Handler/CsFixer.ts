import Environment from "../Env/Environment";
import Cli from "../Generator/Cli";
import inquirer from "inquirer";
import {Choice} from "../Generator/Requirements";
import {existsSync} from "node:fs";

export default class CsFixer {
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

        let pathToModule: string = <string>Object.values(answer.value).pop() ?? ''
        if (!existsSync(pathToModule)) {
            console.warn(`Module folder not found, so integration skipped. ${pathToModule}`)
            return true
        }

        let scenario = [
            new Cli(`composer`, ['cs-fix'], pathToModule),
            new Cli(`composer`, ['cs-check'], pathToModule),
        ]

        let result: boolean = true

        for (const cli of scenario) {
            result = result && await cli.process(true, false, true)
        }

        return result
    }
}