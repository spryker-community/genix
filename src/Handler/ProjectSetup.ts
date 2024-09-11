import Environment from "../Env/Environment";
import Requirements from "../Generator/Requirements";

export default class ProjectSetup {
    private readonly env: Environment;

    constructor(env:Environment) {
        this.env = env;
    }

    public process = async (): Promise<void> => {
        let config = await new Requirements(this.env).process('project')

        this.env.getConfig()
            .addProject(config.getDefaultLayerConfig().getByKey('project'))
            .save()
    }
}