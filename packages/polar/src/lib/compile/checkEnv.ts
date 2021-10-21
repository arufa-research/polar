import chalk from "chalk";
import { execSync } from "child_process";
import semver from "semver";

export function getRustcVersion (rustcVersion: string): string | null {
  try {
    const versionData = execSync(`rustc -V`);
    const [version]: string[] = versionData.toString().split(/\s/)[1]?.trim().split('-') || [];

    return semver.valid(version);
  } catch (error) {
    return null;
  }
}

export function getCargoVersion (cargoVersion: string): string | null {
  try {
    const versionData = execSync(`cargo -V`);
    const [version]: string[] = versionData.toString().split(/\s/)[1]?.trim().split('-') || [];

    return semver.valid(version);
  } catch (error) {
    return null;
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

export function checkEnv (
  { rustcVersion, cargoVersion }: { rustcVersion: string, cargoVersion: string }
): boolean {
  const rustcCurrVersion: string | null = getRustcVersion(rustcVersion);
  const cargoCurrVersion: string | null = getCargoVersion(cargoVersion);

  const wasmInstalled: boolean = getWebAssemblyInstalled();

  if (!rustcCurrVersion) {
    console.log(`Error: rustc not installed.`);
    return false;
  } else if (semver.lt(rustcCurrVersion, rustcVersion)) {
    if (rustcCurrVersion) {
      console.log(`Error: rustc version ${chalk.green(rustcCurrVersion)} installed, required ${chalk.green(rustcVersion)}.`);
    }
    return false;
  }

  if (!cargoCurrVersion) {
    console.log(`Error: rustc not installed.`);
    return false;
  } else if (semver.lt(cargoCurrVersion, cargoVersion)) {
    if (cargoCurrVersion) {
      console.log(`Error: cargo version ${chalk.green(cargoCurrVersion)} installed, required ${chalk.green(cargoVersion)}.`);
    }
    return false;
  }

  if (!wasmInstalled) {
    return false;
  }

  return true;
}
