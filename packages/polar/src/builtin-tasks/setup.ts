import { execSync } from "child_process";

import { task } from "../internal/core/config/config-env";
import { TASK_INSTALL } from "./task-names";

export default function (): void {
  task(TASK_INSTALL, "Setup rust compiler")
    .setAction(setupRust);
}

async function setupRust (): Promise<boolean> {
  execSync(`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`);
  execSync(`export PATH="${process.env.HOME}/.cargo/bin:${process.env.PATH}"`); // eslint-disable-line  @typescript-eslint/restrict-template-expressions
  execSync(`rustup default stable`);
  execSync(`rustup target list --installed`);
  execSync(`rustup target add wasm32-unknown-unknown`);
  execSync(`rustup install nightly`);
  execSync(`rustup target add wasm32-unknown-unknown --toolchain nightly`);
  if (navigator.userAgent.match(/Linux/i) ?? navigator.userAgent.match(/Windows/i)) { execSync(`sudo apt install build-essential`); }

  return true;
}
