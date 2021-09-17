import chalk from "chalk";
import fsExtra from "fs-extra";
import path from "path";

import { task } from "../internal/core/config/config-env";
import { ARTIFACTS_DIR, isCwdProjectDir } from "../internal/core/project-structure";
import type { PolarRuntimeEnvironment } from "../types";
import { TASK_CLEAN } from "./task-names";

interface TaskCleanArg {
  contractName: string | null
}

export default function (): void {
  task(TASK_CLEAN, "Clears the cache and deletes specified artifacts files")
    .setAction(async (
      { contractName }: TaskCleanArg,
      env: PolarRuntimeEnvironment
    ) => {
      if (!isCwdProjectDir()) {
        console.log(`Not in a valid polar project repo, exiting`);
        process.exit(1);
      } else if (contractName === null) {
        const artifactsAbsPath = path.resolve(process.cwd(), ARTIFACTS_DIR);
        console.log(`Cleaning artifacts directory: ${chalk.gray(artifactsAbsPath)}`);
        await fsExtra.remove('./artifacts/contracts/sample.wasm');
        await fsExtra.remove('./artifacts/schema/sample/');
        await fsExtra.remove('./artifacts/checkpoints/sample.yaml');
      } else {
        const artifactsAbsPath = path.resolve(process.cwd(), ARTIFACTS_DIR);
        console.log(`Cleaning artifacts directory: ${chalk.gray(artifactsAbsPath)}`);
        await fsExtra.remove('./artifacts/contracts/' + contractName + '.wasm');
        await fsExtra.remove('./artifacts/schema/' + contractName + '/');
        await fsExtra.remove('./artifacts/checkpoints/' + contractName + '.yaml}');
      }
    });
}
