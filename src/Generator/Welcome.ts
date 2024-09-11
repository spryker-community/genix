import chalk from "chalk";
import figlet from "figlet";

export default class Welcome {
    process  = async (): Promise<boolean> => {
        console.clear()
        console.log(
            chalk.green(
                figlet.textSync("GeniX", {
                    font: "Jacky",
                    horizontalLayout: "full",
                    verticalLayout: "full"
                })
            )
        );
        return true
    }
}