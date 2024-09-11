import Environment from "../Env/Environment";
import inquirer from "inquirer";

export default class SwitchActiveProject {
    private readonly env: Environment;

    constructor(env:Environment) {
        this.env = env;
    }

    public process = async (): Promise<void> => {
        let projectList = this.env.getConfig().getProjectList()
        let answer:any = await inquirer.prompt(
            {
                type: 'list',
                name: 'value',
                //@ts-ignore
                message: 'Please chose project you would like to keep as default',
                choices: Object.keys(projectList).map((key:string) => {
                    return {
                        name: key,
                        value: key
                    }
                })
            }
        )

        this.env.getConfig()
            .setActiveProject(answer.value)
            .save()
    }
}