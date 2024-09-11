import chalk from 'chalk';

export default class Default {
    private readonly message: string;
    private readonly stop: boolean;

    constructor(message: string, stop: boolean = false) {
        this.message = message;
        this.stop = stop;
    }

    public process = async (): Promise<void> => {
        console.log(`${this.message}`)
        if (this.stop) {
            process.exit(0)
        }
    }
}