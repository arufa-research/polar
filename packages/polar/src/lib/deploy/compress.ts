import chalk from "chalk";
import { execSync } from "child_process";
import fs, { readdirSync } from "fs-extra";
import path from "path";

import {
  ARTIFACTS_DIR,
  CONTRACTS_DIR,
  CONTRACTS_OUT_DIR,
  multiImageVersion,
  singleImageVersion
} from "../../internal/core/project-structure";

export async function compress (
  contractName: string
): Promise<void> {
  const sourcePath = path.join(CONTRACTS_DIR, "artifacts", `${contractName}.wasm`);
  const destPath = path.join(CONTRACTS_OUT_DIR, `${contractName}_compressed.wasm`);

  if (fs.existsSync(destPath)) {
    console.log(`Compressed .wasm file exists for contract ${contractName}, skipping compression`);
    return;
  }
  const paths = readdirSync(CONTRACTS_DIR);
  if (paths.includes("Cargo.toml")) { // Only one contract in the contracts dir and compile in contracts dir only
    const dockerCmd = `docker run --rm -v ${path.resolve(CONTRACTS_DIR)}:/code \
                  --mount type=volume,source=${path.basename(ARTIFACTS_DIR)},target=/code/target \
                  --mount type=volume,source=${path.basename(ARTIFACTS_DIR)},target=/usr/local/cargo/registry \
                  cosmwasm/rust-optimizer:${singleImageVersion}`;

    console.log(chalk.greenBright(`Creating compressed .wasm file using cosmwasm/rust-optimizer:${singleImageVersion}...`));
    execSync(dockerCmd, { stdio: 'inherit' });

    fs.copyFileSync(sourcePath, destPath);
    fs.rmdirSync(path.join(CONTRACTS_DIR, "artifacts"), { recursive: true });
    console.log(`Created file ${path.join(CONTRACTS_OUT_DIR, `${contractName}.wasm`)}`);
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
