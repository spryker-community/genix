import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from "chalk";

const execPromise = promisify(exec);

export default class Cli {
    private args: string[];
    private readonly handler: string;
    private readonly targetFolder: string;

    constructor(handler: string, args: string[], targetFolder: string = '') {
        this.handler = handler;
        this.args = args;
        this.targetFolder = targetFolder;
    }

    process = async (showResults: boolean = true, showErrors: boolean = true, ignoreErrors:boolean = false): Promise<boolean> => {
        const command = `${this.handler} ${this.args.join(' ')}`;
        try {
            const options = this.targetFolder ? { cwd: this.targetFolder } : {};

            const { stdout, stderr } = await execPromise(command, options);
            if (stdout && showResults) {
                console.log('stdout=>>>>>', chalk.green(stdout));
            }

            // if (stderr && showErrors) {
            //     console.error('stderr=>>>>>', chalk.red(stderr));
            // }

            return true;
        } catch (error:any) {
            if (showErrors) {
                console.error(chalk.red(`Error executing command: ${command} => ${error.message}`));
            }
            return ignoreErrors;
        }
    }
}