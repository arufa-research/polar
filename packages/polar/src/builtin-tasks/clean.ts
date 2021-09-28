import chalk from "chalk";
import fsExtra from "fs-extra";
import path from "path";

import { ERRORS } from "../../src/internal/core/errors-list";
import { task } from "../internal/core/config/config-env";
import { PolarError } from "../internal/core/errors";
import { ARTIFACTS_DIR, isCwdProjectDir } from "../internal/core/project-structure";
import type { PolarRuntimeEnvironment } from "../types";
import { TASK_CLEAN } from "./task-names";

export interface TaskCleanArg {
  contractName: string
}

export default function (): void {
  task(TASK_CLEAN, "Clears the cache and deletes specified artifacts files")
    .addOptionalVariadicPositionalParam(
      "contractName",
      "Name of the contract to be cleaned",
      []
    )
    .setAction(async (
      { contractName }: TaskCleanArg,
      env: PolarRuntimeEnvironment
    ) => {
      const comp = './artifacts/contracts/' + contractName + '.wasm';
      if (!isCwdProjectDir()) {
        console.log(`Not in a valid polar project repo, exiting`);
        process.exit(1);
      } else if (!fsExtra.existsSync(`./${ARTIFACTS_DIR}`)) {
        throw new PolarError(ERRORS.GENERAL.ARTIFACTS_NOT_FOUND);
      } else if (contractName.length !== 0 && fsExtra.existsSync(comp)) {
        const artifactsAbsPath = path.resolve(process.cwd(), ARTIFACTS_DIR);
        console.log(`Cleaning Artifacts directory: ${chalk.gray(artifactsAbsPath)}`);
        await fsExtra.remove(comp);
        await fsExtra.remove('./artifacts/schema/' + contractName + '/');
        await fsExtra.remove('./artifacts/checkpoints/' + contractName + '.yaml}');
      // } else if (contractName.length !== 0 && !(fsExtra.existsSync(comp))) {
      //   throw new PolarError(ERRORS.GENERAL.INCORRECT_CONTRACT_NAME);
      } else {
        const artifactsAbsPath = path.resolve(process.cwd(), ARTIFACTS_DIR);
        console.log(`Cleaning Artifacts directory: ${chalk.gray(artifactsAbsPath)}`);
        await fsExtra.remove(ARTIFACTS_DIR);
      }
    });
}
