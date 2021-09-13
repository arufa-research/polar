import chalk from "chalk";
import { execSync } from "child_process";
import { readdirSync } from "fs";
import fs from "fs-extra";
import path from "path";

import { PolarError } from "../../internal/core/errors";
import { ERRORS } from "../../internal/core/errors-list";
import {
  ARTIFACTS_DIR,
  assertDir,
  CACHE_DIR,
  CONTRACTS_DIR,
  SCHEMA_DIR,
  TARGET_DIR
} from "../../internal/core/project-structure";

export async function compile (
  docker: boolean,
  sourceDir: string[],
  force: boolean
): Promise<void> {
  await assertDir(CACHE_DIR);
  let contractDirs: string[] = [];

  // Contract(s) path given
  if (sourceDir.length > 0) {
    contractDirs = sourceDir;
  } else {
    const paths = readdirSync(CONTRACTS_DIR);
    // Only one contract in the contracts dir and compile in contracts dir only
    if (paths.includes("Cargo.toml")) {
      contractDirs.push(CONTRACTS_DIR);
    } else {
      // Multiple contracts and each should be compiled by going inside each of them
      for (const p of paths) {
        const contractPath = path.join(CONTRACTS_DIR, path.basename(p));
        contractDirs.push(contractPath);
      }
    }
  }

  for (const dir of contractDirs) {
    compileContract(dir, docker);
    generateSchema(dir, docker);
    createArtifacts(
      path.join(dir, TARGET_DIR), path.join(ARTIFACTS_DIR, "schema"), path.join(ARTIFACTS_DIR, dir), path.join(dir, "schema"), docker
    );
  }
}

export function compileContract (contractDir: string, docker: boolean): void {
  const currDir = process.cwd();
  process.chdir(contractDir);
  console.log(`Compiling contract in directory: ${chalk.gray(contractDir)}`);
  // Compiles the contract and creates .wasm file alongside others
  try {
    execSync(`RUSTFLAGS='-C link-arg=-s' cargo build --release --target wasm32-unknown-unknown`, { stdio: 'inherit' });
  } catch (error) {
    if (error instanceof Error) {
      throw new PolarError(ERRORS.GENERAL.RUST_COMPILE_ERROR);
    } else {
      throw error;
    }
  }

  process.chdir(currDir);
}

export function generateSchema (contractDir: string, docker: boolean): void {
  const currDir = process.cwd();
  process.chdir(contractDir);
  console.log(`Creating schema for contract in directory: ${chalk.gray(contractDir)}`);

  // Creates schema .json files
  execSync(`cargo run --example schema`, { stdio: 'inherit' });

  process.chdir(currDir);
}

export function createArtifacts (
  targetDir: string,
  schemaDir: string,
  artifactsDir: string,
  sourceSchemaDir: string,
  docker: boolean
): void {
  const paths = fs.readdirSync(targetDir);

  // create nested dirs if not present
  if (!fs.existsSync(artifactsDir)) {
    fs.mkdirSync(artifactsDir, { recursive: true });
  }
  if (!fs.existsSync(schemaDir)) {
    fs.mkdirSync(schemaDir, { recursive: true });
  }

  for (const p of paths) {
    const filename = path.basename(p);
    if (filename.split('.')[filename.split('.').length - 1] !== "wasm") {
      continue;
    }

    console.log(`Copying file ${filename} from ${chalk.gray(targetDir)} to ${chalk.gray(artifactsDir)}`);
    const sourcePath = path.resolve(targetDir, filename);
    const destPath = path.resolve(artifactsDir, filename);
    fs.copyFileSync(sourcePath, destPath);
  }

  const schemaPaths = fs.readdirSync(sourceSchemaDir);

  for (const p of schemaPaths) {
    const filename = path.basename(p);
    if (filename.split('.')[filename.split('.').length - 1] !== "json") {
      continue;
    }

    console.log(
      `Copying file ${filename} from ${chalk.gray(sourceSchemaDir)} to ${chalk.gray(schemaDir)}`
    );
    const sourcePath = path.resolve(sourceSchemaDir, filename);
    const destPath = path.resolve(schemaDir, filename);
    fs.copyFileSync(sourcePath, destPath);
  }
}
