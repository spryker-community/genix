import * as fs from 'fs';

interface Autoload {
    [namespace: string]: string;
}

interface Scripts {
    [scriptName: string]: string | string[];
}

interface Config {
    [configKey: string]: string | boolean | number;
}

interface Extra {
    [extraKey: string]: any;
}

interface ComposerJsonContent {
    name?: string;
    description?: string;
    version?: string;
    type?: string;
    keywords?: string[];
    homepage?: string;
    license?: string;
    authors?: { name: string; email?: string; homepage?: string; role?: string }[];
    require?: { [packageName: string]: string };
    'require-dev'?: { [packageName: string]: string };
    autoload?: {
        'psr-4'?: Autoload;
        'classmap'?: string[];
        'files'?: string[];
    };
    'autoload-dev'?: {
        'psr-4'?: Autoload;
        'classmap'?: string[];
        'files'?: string[];
    };
    scripts?: Scripts;
    config?: Config;
    extra?: Extra;
    minimum_stability?: string;
    prefer_stable?: boolean;
    repositories?: { type: string; url: string }[];
    replace?: { [packageName: string]: string };
    provide?: { [packageName: string]: string };
    conflict?: { [packageName: string]: string };
    bin?: string[];
}

export default class ComposerJson {
    private content: ComposerJsonContent = {};

    load = (filePath: string): ComposerJson => {
        const data = fs.readFileSync(filePath, 'utf-8');
        this.content = JSON.parse(data);
        return this;
    }

    setName = (name: string): ComposerJson => {
        this.content.name = name;
        return this;
    }

    setDescription = (description: string): ComposerJson => {
        this.content.description = description;
        return this;
    }

    setVersion = (version: string): ComposerJson => {
        this.content.version = version;
        return this;
    }

    setType = (type: string): ComposerJson => {
        this.content.type = type;
        return this;
    }

    setKeywords = (keywords: string[]): ComposerJson => {
        this.content.keywords = keywords;
        return this;
    }

    setHomepage = (homepage: string): ComposerJson => {
        this.content.homepage = homepage;
        return this;
    }

    setLicense = (license: string): ComposerJson => {
        this.content.license = license;
        return this;
    }

    addAuthor = (name: string, email?: string, homepage?: string, role?: string): ComposerJson => {
        if (!this.content.authors) {
            this.content.authors = [];
        }
        this.content.authors.push({name, email, homepage, role});
        return this;
    }

    addRequire = (packageName: string, version: string = '*'): ComposerJson => {
        if (!this.content.require) {
            this.content.require = {};
        }
        this.content.require[packageName] = version;
        return this;
    }

    addRequireDev = (packageName: string, version: string = '*'): ComposerJson => {
        if (!this.content['require-dev']) {
            this.content['require-dev'] = {};
        }
        //@ts-ignore
        this.content['require-dev'][packageName] = version;
        return this;
    }

    setAutoload = (namespace: string, folder: string): ComposerJson => {
        if (!this.content.autoload) {
            this.content.autoload = {'psr-4': {}};
        }
        if (!this.content.autoload['psr-4']) {
            this.content.autoload['psr-4'] = {};
        }
        //@ts-ignore
        this.content.autoload['psr-4'][namespace] = folder;
        return this;
    }

    setAutoloadDev = (namespace: string, folder: string): ComposerJson => {
        if (!this.content['autoload-dev']) {
            this.content['autoload-dev'] = {'psr-4': {}};
        }
        //@ts-ignore
        if (!this.content['autoload-dev']['psr-4']) {
            //@ts-ignore
            this.content['autoload-dev']['psr-4'] = {};

        }
        //@ts-ignore
        this.content['autoload-dev']['psr-4'][namespace] = folder;
        return this;
    }

    addScript = (scriptName: string, command: string | string[]): ComposerJson => {
        if (!this.content.scripts) {
            this.content.scripts = {};
        }
        this.content.scripts[scriptName] = command;
        return this;
    }

    setConfig = (configKey: string, value: string | boolean | number | any): ComposerJson => {
        if (!this.content.config) {
            this.content.config = {};
        }
        this.content.config[configKey] = value;
        return this;
    }

    addExtra = (extraKey: string, value: any): ComposerJson => {
        if (!this.content.extra) {
            this.content.extra = {};
        }
        this.content.extra[extraKey] = value;
        return this;
    }

    setMinimumStability = (stability: string): ComposerJson => {
        this.content.minimum_stability = stability;
        return this;
    }

    setPreferStable = (preferStable: boolean): ComposerJson => {
        this.content.prefer_stable = preferStable;
        return this;
    }

    addRepository = (type: string, url: string): ComposerJson => {
        if (!this.content.repositories) {
            this.content.repositories = [];
        }
        this.content.repositories.push({type, url});
        return this;
    }

    addReplace = (packageName: string, version: string): ComposerJson => {
        if (!this.content.replace) {
            this.content.replace = {};
        }
        this.content.replace[packageName] = version;
        return this;
    }

    addProvide = (packageName: string, version: string): ComposerJson => {
        if (!this.content.provide) {
            this.content.provide = {};
        }
        this.content.provide[packageName] = version;
        return this;
    }

    addConflict = (packageName: string, version: string): ComposerJson => {
        if (!this.content.conflict) {
            this.content.conflict = {};
        }
        this.content.conflict[packageName] = version;
        return this;
    }

    toString = (): string => {
        return JSON.stringify(this.content, null, 2)
    }

    addBin = (bin: string): ComposerJson => {
        if (!this.content.bin) {
            this.content.bin = [];
        }
        this.content.bin.push(bin);
        return this;
    }

    save = (filePath: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            fs.writeFile(filePath, JSON.stringify(this.content, null, 2), (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
}