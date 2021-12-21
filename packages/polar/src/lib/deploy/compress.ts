import chalk from "chalk";
import { execSync } from "child_process";
import fs, { readdirSync } from "fs-extra";
import path from "path";
import zlib from "zlib";

import {
  ARTIFACTS_DIR,
  CONTRACTS_DIR,
  CONTRACTS_OUT_DIR
} from "../../internal/core/project-structure";
import { readContractName } from "../compile/compile";

const CONTRACT_WASM = "contract.wasm.gz";

export async function compress (
  contractName: string, imageVersion?: string
): Promise<void> {
  const destPath = path.join(CONTRACTS_OUT_DIR, `${contractName}_compressed.wasm`);

  if (fs.existsSync(destPath)) {
    console.log(`Compressed .wasm file exists for contract ${contractName}, skipping compression`);
    return;
  }
  const paths = readdirSync(CONTRACTS_DIR);
  if (paths.includes("Cargo.toml")) {
    // Only one contract in the contracts dir and compile in contracts dir only
    const dockerCmd = `sudo docker run --rm -v ${path.resolve(CONTRACTS_DIR)}:/contract \
                  --mount type=volume,source=${path.basename(ARTIFACTS_DIR)},target=/code/target \
                  --mount type=volume,source=${path.basename(ARTIFACTS_DIR)},target=/usr/local/cargo/registry \
                  enigmampc/secret-contract-optimizer:${imageVersion ?? "latest"}`;

    console.log(chalk.greenBright(`Creating compressed .wasm file using enigmampc/secret-contract-optimizer:${imageVersion ?? "latest"}...`));
    execSync(dockerCmd, { stdio: 'inherit' });

    const fileContents = fs.createReadStream(path.join(CONTRACTS_DIR, CONTRACT_WASM));
    const writeStream = fs.createWriteStream(destPath);
    const unzip = zlib.createGunzip();

    fileContents.pipe(unzip).pipe(writeStream);
    fs.unlinkSync(path.join(CONTRACTS_DIR, CONTRACT_WASM));
  } else { // Multiple contracts and each should be compiled by going inside each of them
    for (const p of paths) {
      const dockerCmd = `sudo docker run --rm -v ${path.resolve(path.join(CONTRACTS_DIR, p))}:/contract \
                  --mount type=volume,source=${path.basename(ARTIFACTS_DIR)},target=/code/target \
                  --mount type=volume,source=${path.basename(ARTIFACTS_DIR)},target=/usr/local/cargo/registry \
                  enigmampc/secret-contract-optimizer:${imageVersion ?? "latest"}`;

      console.log(chalk.greenBright(`Creating compressed .wasm file using enigmampc/secret-contract-optimizer:${imageVersion ?? "latest"}...`));
      execSync(dockerCmd, { stdio: 'inherit' });

      const contractName = readContractName(path.join(path.join(CONTRACTS_DIR, p), "Cargo.toml"));
      const destPath = path.join(CONTRACTS_OUT_DIR, `${contractName}_compressed.wasm`);

      const fileContents = fs.createReadStream(
        path.join(path.join(CONTRACTS_DIR, p), CONTRACT_WASM)
      );
      const writeStream = fs.createWriteStream(destPath);
      const unzip = zlib.createGunzip();

      fileContents.pipe(unzip).pipe(writeStream);
      fs.unlinkSync(path.join(path.join(CONTRACTS_DIR, p), CONTRACT_WASM));
    }
  }
}
