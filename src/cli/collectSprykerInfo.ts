#!/usr/bin/env tsx

import SprykerInfoUpdater from "../Handler/SprykerInfoUpdater";
import Environment from "../Env/Environment";
import Initialisation from "../Initialisation";
import Util from "../Generator/Util";

const start = async () => {
    let env:Environment = await new Initialisation(Util.getAppConfigPath()).process()
    await new SprykerInfoUpdater(env).process()
}

start().catch(console.dir)
