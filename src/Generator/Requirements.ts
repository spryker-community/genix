import inquirer from 'inquirer';
import Configuration from "./Configuration";
import checkbox, { Separator } from '@inquirer/checkbox';
import { search } from '@inquirer/prompts';
import YAML from 'yaml'
import {existsSync} from "node:fs";
import _ from "lodash";
import Util from "./Util";
import * as fs from 'fs';
import * as ndjson from 'ndjson';
import { promisify } from 'util';
import { pipeline } from 'stream';
import {MethodInfo, MethodParam} from "./Collector/SprykerCollector";
import Environment from "../Env/Environment";
import Questions from "./Questions";
import LayerConfig from "./Config/LayerConfig";
import {ResourcePlaceholder} from "./Processor/Default";
import chalk from "chalk";
import ChoiceProviderInterface, {KEY_ALLOW_CUSTOM} from "./ChoiceProvider/ChoiceProviderInterface";

export type Choice = {
    name: string,
    value: any
}

export type Resource = {
    name: string,
    type: 'dir'|'file',
    processor?: string,
    skip?:boolean,
    placeholder: ResourcePlaceholder[],
    template?: string
}

export type QuestionConfig = {
    layer: string,
    questions?:Question[]
    subLayer?: string,
    resources?: Resource[],
    outputFolder?: string
}

export type Question = {
    name: string,
    type: string,
    path: string,
    message: string,
    copyTo?: string,
    resources?: Resource[],
    confirmMessage?: string,
    required?: boolean,
    skip?: boolean,
    choicesSource?: string,
    processIfDefined?: string,
    confirmBeforeAsk?: boolean,
    choicesSearchType?: string,
    choices?: string[]|Choice[],
    allowCustom?: boolean,
    choiceProvider?:string,
    filter?:any
}

export default class Requirements {
    private readonly configuration: Configuration;
    private readonly env: Environment;

    constructor(env:Environment) {
        this.env = env;
        this.configuration = new Configuration()
    }

    public process = async (configName: string = 'wizard', basePath: string = '/src/Generator/Requirements'): Promise<Configuration> => {
        let targetConfig = this.buildConfigPath(basePath, configName)
        if (!existsSync(targetConfig)) {
            return this.configuration
        }

        let config:any = YAML.parse(fs.readFileSync(targetConfig).toString())
        this.extendConfig(config).extendWithLocal()
        return this.processQuestions(config)
    }

    public getConfig = ():Configuration => {
        return this.configuration
    }

    private buildConfigPath(basePath: string, configName: string): string {
        return [Util.getProjectRootFolder(), basePath, `${_.upperFirst(configName?.toLowerCase())}.yml`].filter((el:string) => el.length > 0).join('/')
    }

    private extendWithLocal = (): Requirements => {
        let targetConfig = this.buildConfigPath('', 'spryk')
        if (!existsSync(targetConfig)) {
            return this
        }
        let config:any = YAML.parse(fs.readFileSync(targetConfig).toString())
        this.extendConfig(config)

        return this
    }

    private extendConfig = (config:any): Requirements => {
        for (const key of Object.keys(config)) {
            if (key === 'questions') continue
            this.configuration[key] = config[key]
        }
        return this
    }

    private processQuestions = async (config:QuestionConfig) => {
        let layer = config.layer

        if (config?.resources?.length) {
            this.configuration.add(layer, 'files', [], config?.resources)
        }

        for (let configElement of Object.values(config.questions ?? [])) {
            if (!configElement) {
                continue
            }

            let question = configElement as Question
            if (question?.skip) {
                continue
            }
            if (question?.processIfDefined?.length) {
                if (!this.configuration.getLayerConfig(layer).getByKey(question?.processIfDefined)
                    || this.configuration.getLayerConfig(layer).getByKey(question?.processIfDefined)[question?.processIfDefined] === false) {
                    continue
                }
            }
            let answer:any

            if (question?.confirmBeforeAsk && question?.confirmMessage?.length) {
                let result:any = await inquirer.prompt({
                    type: 'list',
                    name: 'status',
                    //@ts-ignore
                    message: question.confirmMessage,
                    choices: Questions.getYesNoList()
                })
                if (result.status === Questions.KEY_CONFIRM_NO) {
                    continue
                }
            }
            if (question?.type === 'multiselect' && !question?.choiceProvider?.length) {
                answer = await checkbox(question as any)
            } else if (question?.type === 'autocomplete' && question?.choicesSource?.length) {
                const pipelinePromise = promisify(pipeline);
                const configuration = this.configuration
                const env = this.env
                answer = await search({
                    message: question.message,
                    pageSize: 10,
                    source: async (input, { signal }) => {
                        if (!input || input.length < 4) {
                            return [];
                        }
                        const results: any[] = [];
                        const readStream = fs.createReadStream([Util.getProjectRootFolder(), env.adjustOutputPath(question?.choicesSource ?? '')].join('/'))
                        try {
                            await pipelinePromise(
                                readStream,
                                ndjson.parse(),
                                async function* (source) {
                                    for await (let target of source) {
                                        target = JSON.parse(target)
                                        let searchCriteria = input.split(' ')
                                        if (question?.processIfDefined?.length) {
                                            let layerConfig = configuration.getLayerConfig(layer).getByKey(question.processIfDefined)
                                            searchCriteria.push(layerConfig?.module ?? layerConfig?.name ?? '')
                                        }
                                        let name = [target.namespace, target.name].join('\\')
                                        let description = ''
                                        if (question?.choicesSearchType === 'module') {
                                            name = target.module
                                        } else {
                                            description = `${chalk.green('Available methods:\n')}${target.methods.map((el:MethodInfo) => {
                                                return `${el.method}(${el.params.map((param:MethodParam) => {
                                                    let type = param.type === 'unknown' ? '' : `${param.type}`
                                                    return `${type} ${param.name}`
                                                }).join(', ')}): ${el.returnType}`
                                            }).join('\n') ?? ''}`
                                        }

                                        if (searchCriteria.filter((search:string) => name.toLowerCase().includes(search.toLowerCase())).length === searchCriteria.length) {
                                            results.push({
                                                name: name,
                                                value: target,
                                                description: description,
                                            });
                                        }
                                    }
                                }
                            );
                        } catch (error) {
                            console.error('error during reading NDJSON:', error);
                        }
                        readStream.close()

                        return results;
                    },
                });
            } else {
                if (question?.choiceProvider?.length) {
                    //@ts-ignore
                    const handler = await import(question?.choiceProvider);
                    const handlerClass:any = handler.default;
                    try {
                        const processorInstance:ChoiceProviderInterface = new handlerClass(this.env);
                        question.choices = await processorInstance.get(question?.allowCustom ?? false)

                        answer = await inquirer.prompt(question as any)
                        if (answer[question.name] === KEY_ALLOW_CUSTOM) {
                            question.type = 'input'
                            answer = await inquirer.prompt(question as any)
                        }
                    } catch(error) {
                        console.error(error)
                    }
                } else {
                    answer = await inquirer.prompt(question as any)
                }

            }

            // let key = [config?.subLayer, question?.name].filter((el:any) => el?.length).join('_')
            let key = question?.name

            if (question?.path?.length) {
                this.configuration.add(layer, key, [], question?.resources)
                for (const answerItem of answer) {
                    this.configuration.add(layer, key, answerItem)
                    let targetConfig = this.buildConfigPath(question?.path, answerItem)
                    if (existsSync(targetConfig)) {
                        let itemConfig:any = YAML.parse(fs.readFileSync(targetConfig).toString())
                        await this.processQuestions(itemConfig)
                    }
                }
            } else {
                this.configuration.add(layer, key, answer, question?.resources)
            }

            if (question?.copyTo?.length) {
                this.configuration.add(layer, question.copyTo, Object.fromEntries([[question.copyTo, answer[key]]]), question?.resources)
            }
        }
        return this.configuration;
    }
}