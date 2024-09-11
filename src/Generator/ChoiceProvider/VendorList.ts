import Environment from "../../Env/Environment";
import ChoiceProviderInterface, {KEY_ALLOW_CUSTOM} from "./ChoiceProviderInterface";
import {Choice} from "../Requirements";

export default class VendorList implements ChoiceProviderInterface {
    private readonly env: Environment;

    constructor(env: Environment) {
        this.env = env;
    }

    get = (allowCustomOption: boolean = false): string[] | Choice[] => {
        let result: string[] | Choice[] = this.env.getConfig().getVendorList()

        if (allowCustomOption && result.filter((el:any) => el.value === KEY_ALLOW_CUSTOM).length === 0) {
            //@ts-ignore
            result.push({
                name: '➕ add new vendor',
                value: KEY_ALLOW_CUSTOM
            })
        }

        return result
    }
}