import Configuration from "../../Env/Configuration";

export default class AppConfig {
    private readonly pathToAppConfig: string;

    constructor(pathToAppConfig: string) {
        this.pathToAppConfig = pathToAppConfig;
    }

    process = (project: string, vendor:string, githubKey:string): void => {
        let builder: Configuration = new Configuration(this.pathToAppConfig)

        builder
            .setActiveProject(project)
            .addVendor(vendor)
            .addVendorGitHubKey(vendor, githubKey)
            .save()
    }
}