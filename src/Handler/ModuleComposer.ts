import Environment from "../Env/Environment";
import Configuration from "../Generator/Configuration";
import ComposerJson from "../Generator/ComposerJson";
import Util from "../Generator/Util";
import _ from "lodash";

export default class ModuleComposer {
    private env: Environment;
    private requirements: Configuration;

    constructor(env: Environment, requirements: Configuration) {
        this.env = env;
        this.requirements = requirements;
    }

    public process = async (): Promise<boolean> => {
        let builder: ComposerJson = new ComposerJson()

        builder
            .setName(this.requirements.getComposerName())
            .setDescription(this.requirements.getModuleDescription())
            .setLicense(this.requirements.getTargetLicense())
            .addAuthor(this.requirements.getLicenceOrganisation().toLowerCase())
            .setAutoload(`${this.requirements.getOrganisation()}\\`, `src/${this.requirements.getOrganisation()}/`)
            .setAutoloadDev(`${this.requirements.getOrganisation()}Test\\`, `tests/${this.requirements.getOrganisation()}Test/`)
            .addRequire('php', '>=8.1')
            .addRequireDev('spryker/development', 'dev-beta/frw-8430/master-enable-sniffers-for-3rd-party-modules')
            .addRequireDev('spryker/kernel', '^3.30.0')
            .addRequireDev('spryker/propel-orm', '^1.16.0')
            .addRequireDev('propel/propel', '2.0.0-beta2')
            .addRequireDev('phpstan/phpstan', '1.10.66')
            .addRequireDev('phpunit/phpunit', '^9.5.2')
            .addRequireDev('spryker/architecture-sniffer', '^0.5.5')
            .addRequireDev('spryker/code-sniffer', '^0.17.18')
            .addScript('cs-check', "vendor/bin/phpcs -p -s --standard=vendor/spryker/code-sniffer/SprykerStrict/ruleset.xml src/ tests/")
            .addScript('cs-fix', "vendor/bin/phpcbf -p --standard=vendor/spryker/code-sniffer/SprykerStrict/ruleset.xml src/ tests/")
            .setConfig('allow-plugins', {"dealerdirect/phpcodesniffer-composer-installer": true})

        this.addDevDependencies(builder)

        await builder.save(Util.buildPath([this.requirements.getModuleFullPath(), 'composer.json']))

        return true
    }

    private addDevDependencies = (builder: ComposerJson): void => {
        for (const configItem of this.requirements.getLayerConfig('dependencies').get().values() ?? []) {
            builder.addRequireDev(`spryker/${_.kebabCase(configItem.value.module)}`, '*')
        }
    }
}