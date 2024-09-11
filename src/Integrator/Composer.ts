import Environment from "../Env/Environment";
import ComposerJson from "../Generator/ComposerJson";
import Configuration from "../Generator/Configuration";
import Util from "../Generator/Util";
import {existsSync} from "node:fs";
import Cli from "../Generator/Cli";

export default class Composer {
    private env: Environment;
    private requirements: Configuration;

    constructor(env:Environment, requirements: Configuration) {
        this.env = env;
        this.requirements = requirements;
    }

    process = async (): Promise<boolean> => {
        let pathToComposer: string = Util.buildPath([this.env.getProjectDirectory(), this.env.getCurrentEnv(), 'composer.json'])
        let pathToProject: string = Util.buildPath([this.env.getProjectDirectory(), this.env.getCurrentEnv()])
        if (!existsSync(pathToComposer)) {
            console.log(`Integration impossible because composer could not be found: ${pathToComposer}`)
            return false
        }
        let builder:ComposerJson = new ComposerJson()
        builder
            .load(pathToComposer)
            .addRepository('git', `git@github.com:${this.requirements.getVendor()}/${this.requirements.getRepoName()}.git`)
            // .addRequire(`${this.requirements.getVendor()}/${this.requirements.getRepoName()}`, 'dev-dev')

        await builder.save(pathToComposer)

        return true
    }
}