import Environment from "../Env/Environment";
import Configuration from "../Generator/Configuration";
import * as yaml from 'yaml';
import {writeFileSync} from "node:fs";
import Util from "../Generator/Util";
import ComposerJson from "../Generator/ComposerJson";
import _ from "lodash";
import {MethodInfo} from "../Generator/Collector/SprykerCollector";
import {mkdirSync} from "fs";
import path from "path";

//
// interface IntegrationConfigItem {
//     handler: string
//     handlerArguments: string[]
// }
//
// interface IntegrationConfig {
//     namespace: IntegrationConfigItem;
//     plugins: IntegrationConfigItem[]
//
// }

export default class IntegrationConfig {
    private env: Environment;
    private requirements: Configuration;
    public static integrationFileName: string = '.integration.yml'
    public static integrationGuideFileName: string = 'docs/integration.md'

    constructor(env: Environment, requirements: Configuration) {
        this.env = env;
        this.requirements = requirements;
    }

    process = async (): Promise<boolean> => {
        try {
            let config: any = {}
            config.repository = {
                handler: 'git',
                repo: `git@github.com:${this.requirements.getVendor()}/${this.requirements.getRepoName()}.git`
            }

            config.namespace = {
                handler: 'NameSpaceRegistration',
                handlerArguments: [
                    `${this.env.getPathToCurrentEnv()}/config/Shared/config_default.php`,
                    this.requirements.getOrganisation()
                ]
            }

            this.buildConfig(config)

            writeFileSync(this.getConfigPath(), yaml.stringify(config))
            writeFileSync(this.getIntegrationGuidePath(), this.generateIntegrationGuide(config))

            return true;
        } catch (e) {
            return false;
        }
    }

    private getConfigPath = (): string => {
        return Util.buildPath([
            this.requirements.getModuleFullPath(),
            IntegrationConfig.integrationFileName
        ])
    }

    private getIntegrationGuidePath = (): string => {
        mkdirSync(Util.buildPath([this.requirements.getModuleFullPath(), 'docs']), {recursive: true})

        return Util.buildPath([
            this.requirements.getModuleFullPath(),
            IntegrationConfig.integrationGuideFileName
        ])
    }

    private buildConfig = (config: any): void => {
        for (const configItem of this.requirements.getLayerConfig('registration').get().values() ?? []) {
            let integrationConfig: any = configItem.value
            if (integrationConfig.isPlugin) {
                if (!('plugins' in config)) {
                    config.plugins = []
                }
                let newClass:string = [this.requirements.getModuleName(), integrationConfig.derivedClassName].join('')

                config.plugins.push(
                    Object.fromEntries([[integrationConfig.derivedClassName, {
                        handler: 'PluginRegistration',
                        handlerArguments: [
                            Util.buildPath([this.env.getPathToCurrentEnv(), integrationConfig.projectLevelRegistrationClass.replace(new RegExp(integrationConfig.module, 'g'), integrationConfig.targetModule)]),
                            Util.buildPath([this.env.getPathToCurrentEnv(), integrationConfig.registrationClass.replace(new RegExp(integrationConfig.module, 'g'), integrationConfig.targetModule).replace(_.kebabCase(integrationConfig.module), _.kebabCase(integrationConfig.targetModule))]),
                            integrationConfig.registrationMethod,
                            [integrationConfig.targetNamespace, newClass].join('\\'),
                            newClass,
                        ]
                    }]])
                )
            }
        }
    }

    private generateIntegrationGuide = (config: any): string => {
        let guide = '# Integration Guide\n\n';

        if (config.namespace) {
            guide += this.generateNamespaceSection(config.namespace);
        }

        if (config.plugins) {
            guide += this.generatePluginsSection(config.plugins);
        }

        return guide;
    }

    private generateNamespaceSection = (namespaceConfig: any): string => {
        let namespaceSection = `## Namespace Registration\n\n`;
        namespaceSection += `**File to modify:** \n \`\`\`php \n \`${this.cleanUp(namespaceConfig.handlerArguments[0])}\`\n \`\`\`\n\n`;
        namespaceSection += `**Namespace to add:**  \n \`\`\`php \n \`${namespaceConfig.handlerArguments[1]}\`\n \`\`\`\n\n`;
        namespaceSection += `#### Example:\n`;
        namespaceSection += `\`\`\`php\n`;
        namespaceSection += `$config[KernelConstants::CORE_NAMESPACES] = [\n`;
        namespaceSection += `    'SprykerShop',\n`;
        namespaceSection += `    'SprykerEco',\n`;
        namespaceSection += `    'Spryker',\n`;
        namespaceSection += `    'SprykerSdk',\n`;
        namespaceSection += `    '${namespaceConfig.handlerArguments[1]}'  // New namespace added\n`;
        namespaceSection += `];\n`;
        namespaceSection += `\`\`\`\n\n`;

        return namespaceSection;
    }

    private cleanUp = (targetPath:string): string => {
        return targetPath.replace(this.env.getPathToCurrentEnv(), '').replace('\\\\', '').replace(`${path.sep}${path.sep}`, path.sep)
    }

    private generatePluginsSection = (pluginsConfig: any): string => {
        let pluginsSection = '## Plugins\n\n';

        for (const pluginConfig of pluginsConfig) {
            for (const pluginName in pluginConfig) {
                const plugin = pluginConfig[pluginName];
                const [targetClass, referenceClass, methodName, pluginToRegister] = plugin.handlerArguments;

                pluginsSection += `### Registration of plugin: ${pluginName}\n`;
                pluginsSection += `- **Target Class (where to register):** \n \`\`\`php \n \`${this.cleanUp(targetClass)}\`\n \`\`\`\n\n`;
                pluginsSection += `- **Reference Class (if method is absent in target class):** \n \`\`\`php \n \`${this.cleanUp(referenceClass)}\`\n \`\`\`\n\n`;
                pluginsSection += `- **Method to register plugin:** \n \`\`\`php \n \`${methodName}\`\n \`\`\`\n\n`;
                pluginsSection += `- **Plugin to register:** \n \`\`\`php \n \`${pluginToRegister}\`\n \`\`\`\n\n`;

                pluginsSection += this.generatePluginExample(this.cleanUp(targetClass), methodName, pluginToRegister);
            }
        }

        return pluginsSection;
    }

    private generatePluginExample = (targetClass: string, methodName: string, pluginToRegister: string): string => {
        return `#### Example\n` +
            `\`\`\`php\n` +
            `// In the class \`${targetClass}\`\n` +
            `protected function ${methodName}()\n` +
            `{\n` +
            `    return [\n` +
            `        new \\${pluginToRegister}(),\n` +
            `    ];\n` +
            `}\n` +
            `\`\`\`\n\n`;
    }
}