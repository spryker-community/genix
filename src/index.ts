#!/usr/bin/env tsx

import Handler from "./Handler";
import inquirer from "inquirer";
import Welcome from "./Generator/Welcome";
import Environment from "./Env/Environment";
import Initialisation from "./Initialisation";
import Questions from "./Generator/Questions";
import Util from "./Generator/Util";
import {Choice} from "./Generator/Requirements";

const start = async () => {
    let stop = false
    let env:Environment = await new Initialisation(Util.getAppConfigPath()).process()

    do {
        await new Welcome().process()
        try {
            let answer:any = await inquirer.prompt(
                {
                    type: 'list',
                    name: 'targetMode',
                    //@ts-ignore
                    message: `How can I help you 🤔 (Active project: ${env.getCurrentEnv() ?? 'Require Setup'})`,
                    choices: Questions.getTargetModeList().filter((el:Choice) => {
                        if (env.getCurrentEnv().length) {
                            return true
                        }
                        return [Questions.KEY_ADD_NEW_PROJECT, Questions.KEY_EXIT, Questions.KEY_SWITCH_ACTIVE_PROJECT].filter((key:string) => key === el.value).length
                    })
                }
            )

            await new Handler(env).process(answer.targetMode);

            let result:any = await inquirer.prompt(
                {
                    type: 'list',
                    name: 'stop',
                    //@ts-ignore
                    message: 'Do you want to continue?',
                    choices: Questions.getYesNoList()
                }
            )
            stop = result.stop === Questions.KEY_CONFIRM_NO
        } catch (e) {
            console.log(e)
            stop = true
        }
    } while (!stop)
    process.exit(0);
}

process.on('SIGINT', () => {
    console.log('Process interrupted by Ctrl+C. Exiting...');
    process.exit(0);
});

process.on('exit', (code) => {
    process.exit(code)
});

start().catch(console.dir)
