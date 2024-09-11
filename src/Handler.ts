import chalk from 'chalk';
import ModuleGenerator from "./Handler/ModuleGenerator";
import SprykerInfoUpdater from "./Handler/SprykerInfoUpdater";
import Default from "./Handler/Default";
import Questions from "./Generator/Questions";
import Environment from "./Env/Environment";
import ProjectSetup from "./Handler/ProjectSetup";
import SetActiveProject from "./Handler/SwitchActiveProject";
import IntegrateModule from "./Handler/IntegrateModule";
import CsFixer from "./Handler/CsFixer";

export default class Handler {
    private readonly env: Environment;

    constructor(env:Environment) {
        this.env = env;
    }

    public process = async (mode:string): Promise<void> => {
        await this.getHandler(mode).process()
    }

    private getHandler = (mode:string) => {
        switch (mode) {
            case Questions.KEY_GENERATE_MODULE:
                return new ModuleGenerator(this.env);
            case Questions.KEY_ADD_NEW_PROJECT:
                return new ProjectSetup(this.env);
            case Questions.KEY_INTEGRATE_MODULE:
                return new IntegrateModule(this.env);
            case Questions.KEY_RUN_CS_FIX:
                return new CsFixer(this.env);
            case Questions.KEY_SWITCH_ACTIVE_PROJECT:
                return new SetActiveProject(this.env);
            case Questions.KEY_REFRESH_SPRYKER_INFO:
                return new SprykerInfoUpdater(this.env);
            case Questions.KEY_EXIT:
                return new Default(chalk.green((`Hope to see you soon 👋`)), true)
            default:
                return new Default(chalk.red((`Given mode: ${mode} is not supported`)))
        }
    }
}