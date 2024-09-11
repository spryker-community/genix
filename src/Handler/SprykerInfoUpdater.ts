import Util from "../Generator/Util";
import PhpAnalyzer from "../Generator/Collector/SprykerCollector";
import {SingleBar, Presets} from 'cli-progress';
import Environment from "../Env/Environment";

export default class SprykerInfoUpdater {
    private readonly env: Environment;

    constructor(env: Environment) {
        this.env = env;
    }

    public process = async (): Promise<void> => {
        let path = Util.buildPath([Util.getProjectsFolder(), this.env.getCurrentEnv()])
        if (this.env.getCurrentEnv() === 'suite-nonsplit') {

        }
        const projectPath = [`${path}/vendor/${this.isNonSplit() ? 'spryker/spryker' : 'spryker'}`, `${path}/vendor/${this.isNonSplit() ? 'spryker/spryker-shop' : 'spryker-shop'}`];
        const config = [
            {
                file: 'data/PROJECT/zed.ndjson',
                path: [...projectPath, `${path}/src/Pyz/Zed`],
                keywords: ['/Spryker/Zed'],
                module: false
            },
            {
                file: 'data/PROJECT/yves.ndjson',
                path: [...projectPath, `${path}/src/Pyz/Yves`],
                keywords: ['/Spryker/Yves'],
                module: false
            },
            {
                file: 'data/PROJECT/glue.ndjson',
                path: [...projectPath, `${path}/src/Pyz/Glue`],
                keywords: ['/Spryker/Glue'],
                module: false
            },
            {
                file: 'data/PROJECT/client.ndjson',
                path: [...projectPath, `${path}/src/Pyz/Client`],
                keywords: ['/Spryker/Client'],
                module: false
            },
            {
                file: 'data/PROJECT/service.ndjson',
                path: [...projectPath, `${path}/src/Pyz/Service`],
                keywords: ['/Spryker/Service'],
                module: false
            },
            {
                file: 'data/PROJECT/module/spryker.ndjson',
                path: [`${path}/vendor/${this.isNonSplit() ? 'spryker/spryker/Bundles' : 'spryker'}/`],
                keywords: [],
                module: true
            },
            {
                file: 'data/PROJECT/module/spryker-shop.ndjson',
                path: [`${path}/vendor/${this.isNonSplit() ? 'spryker/spryker-shop/Bundles' : 'spryker-shop'}`],
                keywords: [],
                module: true
            }

        ];

        const progressBar = new SingleBar({
            format: 'Progress |{bar}| {percentage}% | {value}/{total} | Time Passed: {duration_formatted} | Remaining Time: {eta_formatted}',
        }, Presets.shades_classic);

        progressBar.start(config.length, 0);
        const analyzer = new PhpAnalyzer(path);
        let counter = 0

        for (const section of config) {
            counter++
            if (section.module) {
                await analyzer.collectModules(section.path, [Util.getProjectRootFolder(), this.env.adjustOutputPath(section.file)].join('/'), section.keywords ?? []).catch(console.error);
                progressBar.update(counter);
                continue
            }
            await analyzer.runAnalysis(section.path, [Util.getProjectRootFolder(), this.env.adjustOutputPath(section.file)].join('/'), section.keywords ?? []).catch(console.error);
            progressBar.update(counter);
        }
        progressBar.stop();
    }

    private isNonSplit = (): boolean => {
        return this.env.getCurrentEnv() === 'suite-nonsplit'
    }
}