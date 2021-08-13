import chalk from "chalk";
import { execSync } from "child_process";
import fs, { readdirSync } from "fs-extra";
import path from "path";
import zlib from "zlib";

import {
  ARTIFACTS_DIR,
<<<<<<< HEAD
  // eslint-disable-next-line
  assertDir,
  CONTRACTS_DIR,
  CONTRACTS_OUT_DIR,
  multiImageVersion,
  singleImageVersion
} from "../../internal/core/project-structure";
// eslint-disable-next-line
=======
  assertDir,
  CONTRACTS_DIR,
  CONTRACTS_OUT_DIR
} from "../../internal/core/project-structure";
>>>>>>> add compress functionality to deploy task
import { cmpStr } from "../../internal/util/strings";
import type { PolarRuntimeEnvironment } from "../../types";

export async function compress (
  networkName: string[],
  env: PolarRuntimeEnvironment
): Promise<void> {
  const paths = readdirSync(CONTRACTS_DIR);
  if (paths.includes("Cargo.toml")) { // Only one contract in the contracts dir and compile in contracts dir only
<<<<<<< HEAD
    const dockerCmd = `docker run --rm -v ${path.resolve(CONTRACTS_DIR)}:/code \
                  --mount type=volume,source=${path.basename(ARTIFACTS_DIR)},target=/code/target \
                  --mount type=volume,source=${path.basename(ARTIFACTS_DIR)},target=/usr/local/cargo/registry \
                  cosmwasm/rust-optimizer:${singleImageVersion}`;

    console.log(chalk.greenBright(`Creating compressed .wasm file using cosmwasm/rust-optimizer:${singleImageVersion}...`));
=======
    const imageVersion = `0.11.5`;
    const dockerCmd = `docker run --rm -v ${path.resolve(CONTRACTS_DIR)}:/code \
                  --mount type=volume,source=${path.basename(ARTIFACTS_DIR)},target=/code/target \
                  --mount type=volume,source=${path.basename(ARTIFACTS_DIR)},target=/usr/local/cargo/registry \
                  cosmwasm/rust-optimizer:${imageVersion}`;

    console.log(chalk.greenBright(`Creating compressed .wasm file using cosmwasm/rust-optimizer:${imageVersion}...`));
>>>>>>> add compress functionality to deploy task
    execSync(dockerCmd, { stdio: 'inherit' });

    const fileContents = fs.createReadStream(path.join(CONTRACTS_DIR, "contract.wasm.gz"));
    const writeStream = fs.createWriteStream(path.join(CONTRACTS_OUT_DIR, "contract.wasm"));
    const unzip = zlib.createGunzip();

    fileContents.pipe(unzip).pipe(writeStream);
    fs.unlinkSync(path.join(CONTRACTS_DIR, "contract.wasm.gz"));
    console.log(`Created file ${path.join(CONTRACTS_OUT_DIR, "contract.wasm")}`);
  } else { // Multiple contracts and each should be compiled by going inside each of them
<<<<<<< HEAD
    const dockerCmd = `docker run --rm -v ${path.resolve(CONTRACTS_DIR)}:/code \
                  --mount type=volume,source=${path.basename(ARTIFACTS_DIR)},target=/code/target \
                  --mount type=volume,source=${path.basename(ARTIFACTS_DIR)},target=/usr/local/cargo/registry \
                  cosmwasm/workspace-optimizer:${multiImageVersion}`;

    console.log(chalk.greenBright(`Creating compressed .wasm file using cosmwasm/workspace-optimizer:${multiImageVersion}...`));
=======
    const imageVersion = `0.11.5`;
    const dockerCmd = `docker run --rm -v ${path.resolve(CONTRACTS_DIR)}:/code \
                  --mount type=volume,source=${path.basename(ARTIFACTS_DIR)},target=/code/target \
                  --mount type=volume,source=${path.basename(ARTIFACTS_DIR)},target=/usr/local/cargo/registry \
                  cosmwasm/workspace-optimizer:${imageVersion}`;

    console.log(chalk.greenBright(`Creating compressed .wasm file using cosmwasm/workspace-optimizer:${imageVersion}...`));
>>>>>>> add compress functionality to deploy task
    execSync(dockerCmd, { stdio: 'inherit' });
    console.log(`Generated .wasm files in ${ARTIFACTS_DIR}`);
  }
}
