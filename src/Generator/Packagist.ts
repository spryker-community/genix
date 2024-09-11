import Configuration from "./Configuration";
import chalk from "chalk";

export default class Packagist {
    private requirements: Configuration;

    constructor(requirements: Configuration) {
        this.requirements = requirements;
    }

    process  = async (): Promise<boolean> => {
        console.log(chalk.red('processing packagist'))

        return true
    }
}