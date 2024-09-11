import Configuration from "./Configuration";
import chalk from "chalk";
import Cli from "./Cli";
import Util from "./Util";
import {Octokit} from "@octokit/rest";
import SprykDefinition from "./SprykDefinition";
import Environment from "../Env/Environment";
import {existsSync} from "node:fs";

export default class Git {
    private targetPath: string;
    private handler:string = '/usr/bin/git'
    private env: Environment;
    private readonly repoName: string;
    private readonly org: string;
    protected requirements: Configuration;
    protected sprykDefinitions: SprykDefinition[] = [];
    protected gitClient: Octokit|null = null
    protected token:string

    constructor(env:Environment, requirements: Configuration) {
        this.env = env;
        this.requirements = requirements;
        this.targetPath = Util.getModuleFolder(this.requirements)
        this.repoName = this.requirements.getRepoName()
        this.org = this.requirements.getVendor()
        this.token = this.env.getConfig().getGitHubKeyByVendor(this.requirements.getVendor())
        if (this.token.length) {
            this.gitClient = new Octokit({
                auth: `${this.env.getConfig().getGitHubKeyByVendor(this.requirements.getVendor())}`
            });
        }
    }

    process  = async (): Promise<boolean> => {
        // console.log(chalk.green('processing git'))
        await this.init()
        await this.add('.github/workflows/ci.yml')
        await this.commit()
        let remote:boolean = false
        if (this.token) {
            remote = await this.initRemote()
            if (remote) {
                await this.push()
            }
        }
        await this.branch('dev')
        await this.add()
        await this.commit('Module initialisation.')

        if (remote) {
            await this.push()
            // await new Promise(resolve => setTimeout(resolve, 3000));
            await this.createPr('dev', 'main', `${this.repoName} initialisation.`)
            await this.initMainBranchRestrictions()
        }

        return true
    }

    private init = async () => {
        // if (existsSync(Util.buildPath([this.targetPath, '.git']))) {
        //     return
        // }
        await (new Cli(this.handler, ["-C", this.targetPath, 'init'])).process()
    }

    private add = async (whatToAdd:string = '.') => {
        await (new Cli(this.handler, ["-C", this.targetPath, 'add', whatToAdd])).process(false, false)
    }

    private commit = async (message:string = "Init Commit") => {
        await (new Cli(this.handler, ["-C", this.targetPath, 'commit', '-m', '"MESSAGE"'.replace('MESSAGE', message)])).process(false, false)
    }

    private createPr = async (sourceBranch:string, targetBranch: string, title:string): Promise<boolean> => {
        try {
            const response = await this.gitClient?.pulls.create({
                owner: this.org,
                repo: this.repoName,
                head: sourceBranch,
                base: targetBranch,
                title: title,
                body: this.requirements.getModuleDescription()
            });
            console.log(`Pull Request created: ${response?.data?.html_url}`);
            
            return true
        } catch (error) {
            console.error("Error appears during Pull Request creation:", error);
            return false
        }
    }

    private getRepoInfo = async ():Promise<any> => {
        try {
            return await this.gitClient?.repos.get({
                owner: this.org,
                repo: this.repoName
            });

        } catch (error: any) {
            if (error.status === 404) {
                return false;
            }
            throw new Error(`An error occurred: ${error.message}`);
        }
    }

    private initRemote = async (): Promise<boolean> => {
        try {
            let info = await this.getRepoInfo()
            if (info?.data?.ssh_url) {
                return await this.addRemote(info?.data?.ssh_url ?? '')
            }
            const response = await this.gitClient?.repos.createInOrg({
                name: this.repoName,
                description: "",
                org: this.org,
                private: this.requirements.getIsRepoPrivate()
            });

            return await this.addRemote(response?.data?.ssh_url ?? '')
        } catch (error) {
            console.error("Error creating repository:", error);

            return false
        }
    }

    private initMainBranchRestrictions = async (): Promise<boolean> => {
        if (this.requirements.getIsGitHubPro() || this.requirements.getIsRepoPrivate()) {
            return true
        }

        try {
            await this.gitClient?.repos.updateBranchProtection({
                owner: this.org,
                repo: this.repoName,
                branch: "main",
                required_status_checks: {
                    strict: true,
                    contexts: []
                },
                enforce_admins: true,
                required_pull_request_reviews: {
                    dismissal_restrictions: {},
                    dismiss_stale_reviews: true,
                    require_code_owner_reviews: true,
                    required_approving_review_count: 1
                },
                restrictions: null,
                allow_force_pushes: false,
                allow_deletions: false
            });

            return true
        } catch (error) {
            console.error("Error during branch restrictions initialisation:", error);

            return false
        }
    }

    private addRemote = async (gitUrl: string):Promise<boolean> => {
        if (!gitUrl.length) {
            return false
        }
        // await (new Cli(this.handler, ["-C", this.targetPath, 'remote', 'set-url', 'origin', gitUrl])).process()
        return await (new Cli(this.handler, ["-C", this.targetPath, 'remote', 'add', 'origin', gitUrl])).process()
    }

    private push = async (): Promise<boolean> => {
        return await (new Cli(this.handler, ["-C", this.targetPath, 'push', 'origin', '--all'])).process()
    }

    private branch = async (branchName:string = 'dev'): Promise<boolean> => {
        return await (new Cli(this.handler, ["-C", this.targetPath, 'checkout', '-b', branchName])).process()
    }
}