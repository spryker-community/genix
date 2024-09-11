import fs from "fs";
import {writeFileSync} from "node:fs";

interface ConfigurationJsonContent {
    project: string;
    vendors: string[];
    projects: { [project: string]: string }
    keys: { [vendor: string]: string }
}

export default class Configuration {
    private content: ConfigurationJsonContent = {
        project: '',
        vendors: [],
        projects: {},
        keys: {}
    };

    private readonly pathToConfig: string;

    constructor(pathToConfig: string) {
        this.pathToConfig = pathToConfig;
    }

    getProject = (): string => {
        return this.content.project
    }

    getProjectList = (): { [project: string]: string } => {
        return this.content.projects
    }

    getVendorList = (): string[] => {
        return this.content.vendors
    }

    getGitHubKeyByVendor = (vendor: string) => {
        //@ts-ignore
        return this.content.keys[vendor] ?? ''
    }

    addVendor = (vendorName: string): Configuration => {
        this.content.vendors.push(vendorName);
        return this;
    }

    addProject = (config: { [project: string]: string }): Configuration => {
        for (const key of Object.keys(config)) {
            this.content.projects[key] = config[key]
        }
        return this;
    }

    setActiveProject = (project: string): Configuration => {
        this.content.project = project;
        return this;
    }

    addVendorGitHubKey = (vendorName: string, key: string): Configuration => {
        this.content.keys[vendorName] = key;

        return this;
    }

    getConfigPath = (): string => {
        return this.pathToConfig
    }

    load = (): Configuration => {
        const data = fs.readFileSync(this.pathToConfig, 'utf-8');
        this.content = JSON.parse(data) as ConfigurationJsonContent;
        return this;
    }

    save = (): void => {
        if (!this.pathToConfig) {
            return
        }
        writeFileSync(this.pathToConfig, JSON.stringify(this.content, null, 2))
    }
}