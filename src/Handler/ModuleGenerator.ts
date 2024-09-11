import chalk from 'chalk';
import Requirements from "../Generator/Requirements";
import Structure from "../Generator/Structure";
import Welcome from "../Generator/Welcome";
import Git from "../Generator/Git";
import Packagist from "../Generator/Packagist";
// import Spryk from "../Generator/Spryk";
import Configuration from "../Generator/Configuration";
import Environment from "../Env/Environment";
import Spryker from "../Generator/Spryker";
import Composer from "../Integrator/Composer";
import PhpIntegrator from "../Integrator/PhpIntegrator";
import IntegrationConfig from "../Integrator/IntegrationConfig";
import Formatter from "./Formatter";
import ModuleComposer from "./ModuleComposer";
import CsFormatter from "../Integrator/CsFormatter";
import {Presets, SingleBar} from "cli-progress";
import PhpAnalyzer from "../Generator/Collector/SprykerCollector";
import Util from "../Generator/Util";

export default class ModuleGenerator {
    private readonly env: Environment;

    constructor(env:Environment) {
        this.env = env;
    }

    public process = async (): Promise<void> => {
        let config:Configuration
        const requirementsCollector:Requirements = new Requirements(this.env)
        try {
            config = await requirementsCollector.process()
        } catch (error:any) {
            // console.clear()
            console.log(error)
            return
        }

        let handlers:any = [
            // new Spryk(config),
            new Structure(config),
            new Spryker(requirementsCollector),
            new ModuleComposer(this.env, config),
            new Formatter(this.env, config),
            new IntegrationConfig(this.env, config),
            new Git(this.env, config),
            new Composer(this.env, config),
            new PhpIntegrator(this.env, config),
            new CsFormatter(this.env, config)

            // new Packagist(config),
        ]

        let result = true;


        // const progressBar = new SingleBar({
        //     format: 'Progress |{bar}| {percentage}% | {value}/{total} | Time Passed: {duration_formatted} | Remaining Time: {eta_formatted}',
        // }, Presets.shades_classic);
        //
        // progressBar.start(handlers.length, 0);
        // let counter = 0

        for (const handler of handlers) {
            // counter++
            result = result && await handler.process()
            if (!result) {
                console.error(chalk.red(`Failed to process ${handler.constructor.name} handler`))
                break;
            }
            // progressBar.update(counter);
        }

        if (!result) {
            console.error(chalk.yellowBright(`Module generation was not completed successfully :( Please try again!`))
        }
        // progressBar.stop();
    }
}