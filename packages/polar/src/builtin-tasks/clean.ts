import chalk from "chalk";
import fsExtra from "fs-extra";
import path from "path";

import { task } from "../internal/core/config/config-env";
import { ARTIFACTS_DIR, isCwdProjectDir } from "../internal/core/project-structure";
import type { PolarRuntimeEnvironment } from "../types";
import { TASK_CLEAN } from "./task-names";

interface TaskCleanArg {
  sourceDir: string
}

export default function (): void {
  task(TASK_CLEAN, "Clears the cache and deletes specified artifact files")
    .setAction(async (
      { sourceDir }: TaskCleanArg,
      env: PolarRuntimeEnvironment
    ) => {
      if (!isCwdProjectDir()) {
        console.log(`Not in a valid polar project repo, exiting`);
        process.exit(1);
      }
      const artifactsAbsPath = path.resolve(process.cwd(), ARTIFACTS_DIR);
      console.log(`Cleaning artifacts directory: ${chalk.gray(artifactsAbsPath)}`);
      await fsExtra.remove('./artifacts/contracts/sample.wasm');
      await fsExtra.remove('./artifacts/schema/sample/');
      await fsExtra.remove('./artifacts/checkoints/sample.yaml');
    });
}
