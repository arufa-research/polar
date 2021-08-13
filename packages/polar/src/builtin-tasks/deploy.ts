import { task } from "../internal/core/config/config-env";
import { isCwdProjectDir } from "../internal/core/project-structure";
import { compress } from "../lib/deploy/compress";
import type { PolarRuntimeEnvironment } from "../types";
import { TASK_DEPLOY } from "./task-names";

export default function (): void {
  task(TASK_DEPLOY, "Compresses the contracts files and deploys them to the network specified")
    .addPositionalParam<string>("networkName", "Name of network to deploy to")
    .setAction(deployTask);
}

export interface TaskArgs {
  networkName: string[]
}

async function deployTask (
  { networkName }: TaskArgs,
  env: PolarRuntimeEnvironment
): Promise<void> {
  if (!isCwdProjectDir()) {
    console.log(`Not in a valid polar project repo, exiting`);
    process.exit(1);
  }

  // generated compressed wasm file using docker image
  // choose image based on single or multi contact repo
  await compress(networkName, env);

  // store compress wasm in secret network container
}
