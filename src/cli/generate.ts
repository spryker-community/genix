#!/usr/bin/env tsx

import Cli from "../Generator/Cli";
import Util from "../Generator/Util";

const start = async () => {
    await (new Cli('vendor/bin/spryk-build', [], Util.getSprykFolder())).process()
}

start().catch(console.dir)
