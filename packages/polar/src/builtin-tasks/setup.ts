import chalk from "chalk";
import { execSync } from "child_process";

import { task } from "../internal/core/config/config-env";
import { ARTIFACTS_DIR, isCwdProjectDir } from "../internal/core/project-structure";
import type { PolarRuntimeEnvironment } from "../types";
import { TASK_SETUP } from "./task-names";

export default function (): void {
  task(TASK_SETUP, "Setup rust compiler")
    .setAction(setupRust);
}

async function setupRust (): Promise<boolean> {
  execSync(`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`);
  // execSync(`export PATH="${HOME}/.cargo/bin:${PATH}"`);
  execSync(`rustup default stable`);
  execSync(`rustup target list --installed`);
  execSync(`rustup target add wasm32-unknown-unknown`);
  execSync(`rustup install nightly`);
  execSync(`rustup target add wasm32-unknown-unknown --toolchain nightly`);
  execSync(`sudo apt install build-essential`);

  return true;
}
