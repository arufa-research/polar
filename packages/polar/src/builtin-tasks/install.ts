import { execSync } from "child_process";

import { task } from "../internal/core/config/config-env";
import { PolarRuntimeEnvironment, TaskArguments } from "../types";
import { TASK_INSTALL } from "./task-names";

export default function (): void {
  task(TASK_INSTALL, "Setup rust compiler")
    .setAction(taskRust);
}

async function taskRust (
  _taskArgs: TaskArguments, env: PolarRuntimeEnvironment
): Promise<boolean> {
  return await setupRust(env);
}

export async function setupRust (env: PolarRuntimeEnvironment): Promise<boolean> {
  execSync(`curl --proto '=https' --tlsv1.2 -sSf -y https://sh.rustup.rs | sh`);
  execSync(`export PATH="${process.env.HOME}/.cargo/bin:${process.env.PATH}"`); // eslint-disable-line  @typescript-eslint/restrict-template-expressions
  if (env.config.rust) {
    execSync(`rustup default ${env.config.rust.version}`);
  } else {
    execSync(`rustup default stable`);
  }
  execSync(`rustup target list --installed`);
  execSync(`rustup target add wasm32-unknown-unknown`);

  return true;
}
