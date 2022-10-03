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
  TARGET_DIR,
  TS_SCHEMA_DIR
} from "../../internal/core/project-structure";
import { replaceAll } from "../../internal/util/strings";
import { generateTsSchema } from "./tsSchema";
import { readSchemas } from "./utils";

export async function compile (
  docker: boolean,
  sourceDir: string[],
  force: boolean,
  skipSchema: boolean
): Promise<void> {
  await assertDir(CACHE_DIR);
  let contractDirs: string[] = [];
  const toml = "Cargo.toml";
  // Contract(s) path given
  if (sourceDir.length > 0) {
    contractDirs = sourceDir;
  } else {
    const paths = readdirSync(CONTRACTS_DIR);
    // Only one contract in the contracts dir and compile in contracts dir only
    if (paths.includes(toml)) {
      contractDirs.push(CONTRACTS_DIR);
    } else {
      // Multiple contracts and each should be compiled by going inside each of them

      const contractNames = new Set();
      for (const p of paths) {
        const contractPath = path.join(CONTRACTS_DIR, path.basename(p));
        const val = readContractName(path.join(contractPath, toml));

        // Check for similar contract names before compiling contracts.
        // For contract with same names raise an error.
        if (contractNames.has(val)) {
          throw new PolarError(ERRORS.GENERAL.SAME_CONTRACT_NAMES, {
            val
          });
        } else {
          contractNames.add(readContractName(path.join(contractPath, toml)));
          contractDirs.push(contractPath);
        }
      }
    }
  }

  for (const dir of contractDirs) {
    compileContract(dir, docker);
    const contractName = readContractName(path.join(dir, toml));
    if (!skipSchema) { // only generate schema if this flag is not passed
      await generateSchema(contractName, dir, docker);
    }
    createArtifacts(
      TARGET_DIR, path.join(SCHEMA_DIR, contractName), path.join(ARTIFACTS_DIR, CONTRACTS_DIR), path.join(dir, "schema"), docker, skipSchema
    );
  }
}

export function readContractName (tomlFilePath: string): string {
  const tomlFileContent: string = fs.readFileSync(tomlFilePath, 'utf-8');

  return replaceAll(tomlFileContent.split('\n')[1].split("\"")[1], '-', '_');
}

export function compileContract (contractDir: string, docker: boolean): void {
  const currDir = process.cwd();
  process.chdir(contractDir);
  console.log(`🛠 Compiling your contract in directory: ${chalk.gray(contractDir)}`);
  console.log("=============================================");
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

export async function generateSchema (
  contractName: string,
  contractDir: string,
  docker: boolean
): Promise<void> {
  const currDir = process.cwd();
  process.chdir(contractDir);
  console.log(`Creating schema for contract in directory: ${chalk.gray(contractDir)}`);

  // Creates schema .json files
  execSync(`cargo run --example schema`, { stdio: 'inherit' });

  process.chdir(currDir);

  // Creates typescript objects for execute and query msgs from json schema files
  const contractTsSchemaDir = TS_SCHEMA_DIR;
  // create nested dirs if not present
  if (!fs.existsSync(contractTsSchemaDir)) {
    fs.mkdirSync(contractTsSchemaDir, { recursive: true });
  }
  console.log(`Creating TS schema objects for contract in directory: ${chalk.gray(contractTsSchemaDir)}`);

  const srcSchemas = readSchemas(path.join(contractDir, "schema"));
  await generateTsSchema(contractName, srcSchemas, contractTsSchemaDir);
}

export function createArtifacts (
  targetDir: string,
  schemaDir: string,
  artifactsDir: string,
  sourceSchemaDir: string,
  docker: boolean,
  skipSchema: boolean
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

  if (skipSchema) { // do not copy schema to artifacts as there is none
    return;
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
