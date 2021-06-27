import chalk from "chalk";

import { task } from "../internal/core/config/config-env";
import { checkEnv } from "../lib/contract_init/checkEnv";
import { initProject } from "../lib/contract_init/createApp";
import { TASK_INIT } from "./task-names";

export default function (): void {
  task(TASK_INIT, "Initializes a new project in the given directory")
    .addPositionalParam<string>("newProjectName", "Name of the new project")
    .setAction(async ({ newProjectName }: { newProjectName: string }, _) => {
      if (!canInit()) {
        process.exit(1);
      }

      initProject(newProjectName);
    });
}

function canInit (): boolean {
  const reqVersion = '0.6.0';
  const isValidEnv: string | boolean = checkEnv({ version: reqVersion });

  if (!isValidEnv) {
    console.log(`Cargo generate version ${chalk.green(isValidEnv)} present, required ${chalk.green(reqVersion)}.`);
    return false;
  } else {
    return true;
  }
}
