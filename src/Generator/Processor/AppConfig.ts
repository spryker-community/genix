import Configuration from "../../Env/Configuration";

export default class AppConfig {
    private readonly pathToAppConfig: string;

    constructor(pathToAppConfig: string) {
        this.pathToAppConfig = pathToAppConfig;
    }

    process = (project: string, projectPath: string, vendor:string, githubKey:string): void => {
        let builder: Configuration = new Configuration(this.pathToAppConfig)

        console.log(Object.fromEntries([[project, projectPath]]))
        builder
            .setActiveProject(project)
            .addProject(Object.fromEntries([[project, projectPath]]))
            .addVendor(vendor)
            .addVendorGitHubKey(vendor, githubKey)
            .save()
    }
}