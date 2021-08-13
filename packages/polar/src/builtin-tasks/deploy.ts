import chalk from "chalk";
import fsExtra from "fs-extra";
import path from "path";

import { task } from "../internal/core/config/config-env";
import { isCwdProjectDir } from "../internal/core/project-structure";
import type { PolarRuntimeEnvironment } from "../types";
import { TASK_DEPLOY } from "./task-names";

export default function (): void {
  task(TASK_DEPLOY, "Compresses the contracts files and deploys them to the network specified")
    .setAction(async (env: PolarRuntimeEnvironment) => {
      if (!isCwdProjectDir()) {
        console.log(`Not in a valid polar project repo, exiting`);
        process.exit(1);
      }

      // generated compressed wasm file using docker image
      // choose image based on single or multi contact repo

      // store compress wasm in secret network container
    });
}

export interface TaskArgs {
  network: string[]
}
