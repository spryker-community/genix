import Environment from "../Env/Environment";
import Configuration from "../Generator/Configuration";
import Util from "../Generator/Util";
import Cli from "../Generator/Cli";
import IntegrationConfig from "./IntegrationConfig";

export default class PhpIntegrator {
    private env: Environment;
    private requirements: Configuration;

    constructor(env: Environment, requirements: Configuration) {
        this.env = env;
        this.requirements = requirements;
    }

    process = async (): Promise<boolean> => {
        let pathToPhpIntegrator: string = Util.buildPath([Util.getProjectRootFolder(), 'src/Php/src/Integrator.php'])

        return await (new Cli(`php `, [`${pathToPhpIntegrator}`, '-t', `${this.requirements.getModuleFullPath()}`])).process(true, true)
    }
}