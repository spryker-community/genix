import Environment from "../../Env/Environment";
import ChoiceProviderInterface, {KEY_ALLOW_CUSTOM} from "./ChoiceProviderInterface";
import {Choice} from "../Requirements";

export default class ProjectList implements ChoiceProviderInterface {
    private readonly env: Environment;

    constructor(env: Environment) {
        this.env = env;
    }

    get = (allowCustomOption: boolean = false): string[] | Choice[] => {

        return this.env.getProjectList()
    }
}