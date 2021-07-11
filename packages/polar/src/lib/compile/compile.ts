import chalk from "chalk";
import { execSync } from "child_process";
import { readdirSync } from "fs";
import fs from "fs-extra";
import path from "path";

import {
  ARTIFACTS_DIR,
  assertDir,
  CACHE_DIR,
  CONTRACTS_DIR,
  SCHEMA_DIR,
  TARGET_DIR
} from "../../internal/core/project-structure";
import { cmpStr } from "../../internal/util/strings";
import type { PolarRuntimeEnvironment } from "../../types";

export async function compile (
  docker: boolean,
  sourceDir: string[],
  force: boolean,
  env: PolarRuntimeEnvironment
): Promise<void> {
  await assertDir(CACHE_DIR);
  const contractDirs: string[] = [];

  // Contract(s) path given
  if (sourceDir.length > 0) {
    const currDir = process.cwd();
    for (const dir of sourceDir) {
      const contractAbsPath = path.resolve(currDir, dir);
      contractDirs.push(contractAbsPath);
    }
  } else {
    const paths = readdirSync(CONTRACTS_DIR);

    // Only one contract in the contracts dir and compile in contracts dir only
    if (paths.includes("Cargo.toml")) {
      contractDirs.push(CONTRACTS_DIR);
    }

    // Multiple contracts and each should be compiled by going inside each of them
    for (const p of paths.sort(cmpStr)) {
      const f = path.basename(p);
      const contractAbsPath = path.resolve(CONTRACTS_DIR, f);
      contractDirs.push(contractAbsPath);
    }
  }

  for (const dir of contractDirs) {
    compileContract(dir, docker);
    generateSchema(dir, docker);
  }
  createArtifacts(TARGET_DIR, SCHEMA_DIR, ARTIFACTS_DIR, docker);
}

export function compileContract (contractDir: string, docker: boolean): void {
  const currDir = process.cwd();
  process.chdir(contractDir);
  console.log(`Compiling contract in directory: ${chalk.gray(contractDir)}`);

  // Compiles the contract and creates .wasm file alongside others
  execSync(`cargo wasm`, { stdio: 'inherit' });

  process.chdir(currDir);
}

export function generateSchema (contractDir: string, docker: boolean): void {
  const currDir = process.cwd();
  process.chdir(contractDir);
  console.log(`Creating schema for contract in directory: ${chalk.gray(contractDir)}`);

  // Creates schema .json files
  execSync(`cargo schema`, { stdio: 'inherit' });

  process.chdir(currDir);
}

export function createArtifacts (
  targetDir: string,
  schemaDir: string,
  artifactsDir: string,
  docker: boolean
): void {
  const paths = fs.readdirSync(targetDir);

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

  const schemaPaths = fs.readdirSync(schemaDir);

  for (const p of schemaPaths) {
    const filename = path.basename(p);
    if (filename.split('.')[filename.split('.').length - 1] !== "json") {
      continue;
    }

    console.log(`Copying file ${filename} from ${chalk.gray(schemaDir)} to ${chalk.gray(artifactsDir)}`);
    const sourcePath = path.resolve(schemaDir, filename);
    const destPath = path.resolve(artifactsDir, filename);
    fs.copyFileSync(sourcePath, destPath);
  }
}
