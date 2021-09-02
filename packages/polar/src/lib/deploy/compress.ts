import chalk from "chalk";
import { execSync } from "child_process";
import fs, { readdirSync } from "fs-extra";
import path from "path";
import zlib from "zlib";

import {
  ARTIFACTS_DIR,
  // eslint-disable-next-line
  assertDir,
  CONTRACTS_DIR,
  CONTRACTS_OUT_DIR,
  multiImageVersion,
  singleImageVersion
} from "../../internal/core/project-structure";
// eslint-disable-next-line
import { cmpStr } from "../../internal/util/strings";
import type { PolarRuntimeEnvironment } from "../../types";

export async function compress (
  networkName: string[],
  env: PolarRuntimeEnvironment
): Promise<void> {
  const paths = readdirSync(CONTRACTS_DIR);
  if (paths.includes("Cargo.toml")) { // Only one contract in the contracts dir and compile in contracts dir only
    const dockerCmd = `docker run --rm -v ${path.resolve(CONTRACTS_DIR)}:/code \
                  --mount type=volume,source=${path.basename(ARTIFACTS_DIR)},target=/code/target \
                  --mount type=volume,source=${path.basename(ARTIFACTS_DIR)},target=/usr/local/cargo/registry \
                  cosmwasm/rust-optimizer:${singleImageVersion}`;

    console.log(chalk.greenBright(`Creating compressed .wasm file using cosmwasm/rust-optimizer:${singleImageVersion}...`));
    execSync(dockerCmd, { stdio: 'inherit' });

    const fileContents = fs.createReadStream(path.join(CONTRACTS_DIR, "contract.wasm.gz"));
    const writeStream = fs.createWriteStream(path.join(CONTRACTS_OUT_DIR, "contract.wasm"));
    const unzip = zlib.createGunzip();

    fileContents.pipe(unzip).pipe(writeStream);
    fs.unlinkSync(path.join(CONTRACTS_DIR, "contract.wasm.gz"));
    console.log(`Created file ${path.join(CONTRACTS_OUT_DIR, "contract.wasm")}`);
  } else { // Multiple contracts and each should be compiled by going inside each of them
    const dockerCmd = `docker run --rm -v ${path.resolve(CONTRACTS_DIR)}:/code \
                  --mount type=volume,source=${path.basename(ARTIFACTS_DIR)},target=/code/target \
                  --mount type=volume,source=${path.basename(ARTIFACTS_DIR)},target=/usr/local/cargo/registry \
                  cosmwasm/workspace-optimizer:${multiImageVersion}`;

    console.log(chalk.greenBright(`Creating compressed .wasm file using cosmwasm/workspace-optimizer:${multiImageVersion}...`));
    execSync(dockerCmd, { stdio: 'inherit' });
    console.log(`Generated .wasm files in ${ARTIFACTS_DIR}`);
  }
}

