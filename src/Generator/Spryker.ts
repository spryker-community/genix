import Requirements from "./Requirements";
import Structure from "./Structure";
import inquirer from "inquirer";
import Questions from "./Questions";

export default class Spryker {
    private requirementsCollector: Requirements;

    constructor(requirementsCollector: Requirements) {
        this.requirementsCollector = requirementsCollector;
    }

    process  = async (): Promise<boolean> => {
        try {
            let stop = false
            do {
                let config = await this.requirementsCollector.process('module')

                await new Structure(config).process()

                let result:any = await inquirer.prompt(
                    {
                        type: 'list',
                        name: 'stop',
                        //@ts-ignore
                        message: 'Do you want to add more?',
                        choices: Questions.getYesNoList()
                    }
                )
                stop = result.stop === Questions.KEY_CONFIRM_NO
            }  while (!stop)
        } catch (e) {
            console.log(e)
        }

        return true
    }
}