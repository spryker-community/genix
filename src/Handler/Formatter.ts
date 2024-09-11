import Environment from "../Env/Environment";
import Configuration from "../Generator/Configuration";
import Cli from "../Generator/Cli";

export default class Formatter {
    private env: Environment;
    private requirements: Configuration;

    constructor(env: Environment, requirements: Configuration) {
        this.env = env;
        this.requirements = requirements;
    }

    public process = async (): Promise<boolean> => {
        let scenario = [
            new Cli(`composer`, ['install', '--no-interaction'], this.requirements.getModuleFullPath()),
            new Cli(`composer`, ['cs-fix'], this.requirements.getModuleFullPath()),
            new Cli(`composer`, ['cs-check'], this.requirements.getModuleFullPath()),
            new Cli(`vendor/bin/phpstan`, [], this.requirements.getModuleFullPath()),
        ]
        let result: boolean = true

        for (const cli of scenario) {
            result = result && await cli.process(true, false, true)
        }
        return result
    }
}