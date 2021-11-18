import chalk from "chalk";
import { execSync } from "child_process";
import semver from "semver";

import { setupRust } from "../../builtin-tasks/install";
import { PolarRuntimeEnvironment } from "../../types";

export function getRustcVersion (): string {
  try {
    const versionData = execSync(`rustc -V`);
    const [version]: string[] = versionData.toString().split(/\s/)[1]?.trim().split('-') || [];

    const res = semver.valid(version);
    if (typeof res === "string") {
      return res;
    } else {
      throw new Error("Invalid rust version");
    }
  } catch (error) {
    throw new Error("Can't fetch rust version");
  }
}

export function getWebAssemblyInstalled (): boolean {
  try {
    const stableVersionData = execSync(`rustup target list --installed --toolchain stable`);
    const stableVersion: string[] = stableVersionData.toString().split(/\n/) || [];

    if (!stableVersion.includes('wasm32-unknown-unknown')) {
      console.log(`wasm stable compiler not installed. Try ${chalk.grey('rustup target add wasm32-unknown-unknown --toolchain stable')}`);
      return false;
    }
    return true;
  } catch (error) {
    return false;
  }
}

export async function canCompile (
  env: PolarRuntimeEnvironment
): Promise<boolean> {
  const rustcCurrVersion = getRustcVersion();
  const wasmInstalled: boolean = getWebAssemblyInstalled();
  const wantVersion = env.config.rust?.version ?? rustcCurrVersion;

  if (!rustcCurrVersion) {
    console.log(`Warning: rustc not installed.`);
    console.log("Installing rust");
    await setupRust(env);
  } else if (rustcCurrVersion.localeCompare(wantVersion) !== 0) {
    console.log(`warning: rustc version ${chalk.green(rustcCurrVersion)} installed, required ${chalk.green(env.config.rust?.version)}.`);
    console.log("Updating rust version");
    await setupRust(env);
  }

  if (!wasmInstalled) {
    execSync(`rustup target add wasm32-unknown-unknown`);
  }

  return true;
}
