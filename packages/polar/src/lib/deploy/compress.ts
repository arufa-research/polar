import chalk from "chalk";
import { execSync } from "child_process";
import fs, { readdirSync } from "fs-extra";
import path from "path";

import {
  ARTIFACTS_DIR,
  CONTRACTS_OUT_DIR
} from "../../internal/core/project-structure";
import { compile } from "../compile/compile";

export async function compress (
  contractName: string
): Promise<void> {
  const srcPath = path.join(CONTRACTS_OUT_DIR, `${contractName}.wasm`);
  const destPath = path.join(CONTRACTS_OUT_DIR, `${contractName}_compressed.wasm`);

  if (fs.existsSync(destPath)) {
    console.log(`Compressed .wasm file exists for contract ${contractName}, skipping compression`);
    return;
  }

  if (!fs.existsSync(srcPath)) {
    console.log(`${contractName}.wasm file does not exist in artifacts dir, compiling...`);
    await compile(false, [], false, false);
  }

  const compressCmd = `npx wasm-opt -Oz ${srcPath} -o ${destPath}`;

  console.log(chalk.greenBright(`Creating compressed .wasm file for ${contractName}`));
  execSync(compressCmd, { stdio: 'inherit' });
}
