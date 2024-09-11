import {Resource} from "../Requirements";
import Default from "./Default";
import ComposerJson from "../ComposerJson";

export default class Composer extends Default {
    process = (resourceConfig: Resource): string => {
        let builder:ComposerJson = new ComposerJson()

        return builder
            .setName(this.config.getComposerName())
            .setDescription(this.config.getModuleDescription())
            .setLicense(this.config.getTargetLicense())
            .addAuthor(this.config.getLicenceOrganisation().toLowerCase())
            .setAutoload(`${this.config.getOrganisation()}\\`, `src/${this.config.getOrganisation()}/`)
            .setAutoloadDev(`${this.config.getOrganisation()}Test\\`, `tests/${this.config.getOrganisation()}Test/`)
            .addRequire('php', '>=8.1')
        //     "spryker/product-management": "*",
        //     "spryker/product-management-extension": "*"
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
            .toString()
    }
}