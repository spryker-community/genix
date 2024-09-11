import {Choice} from "../Requirements";

export const KEY_ALLOW_CUSTOM = 'custom';

export default interface ChoiceProviderInterface {
    get(allowCustomOption: boolean): string[] | Choice[]
}