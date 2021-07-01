import { readdirSync } from "fs";
import path from "path";

import { task } from "../internal/core/config/config-env";
import { ARTIFACTS_DIR, assertDir, CACHE_DIR, CONTRACTS_DIR, TARGET_DIR } from "../internal/core/project-structure";
import { cmpStr } from "../internal/util/strings";
import { checkEnv } from "../lib/compile/checkEnv";
import { compileContract, createArtifacts } from "../lib/compile/compile";
import type { PolarRuntimeEnvironment } from "../types";
import { TASK_COMPILE } from "./task-names";

export default function (): void {
  task(TASK_COMPILE, "Compile all secret contracts")
    .addFlag("force", "recompile even if the source file didn't change")
    .setAction(compileTask);
}

export interface TaskArgs {
  force: boolean
}

function compileTask ({ force }: TaskArgs, env: PolarRuntimeEnvironment): Promise<void> {
  if (!canCompile(env)) { // check if proper verion of rust wasm compiler is installed
    process.exit(1);
  }

  return compile(force, env);
}

function canCompile (env: PolarRuntimeEnvironment): boolean {
  return checkEnv({ rustcVersion: '1.50.0', cargoVersion: '1.50.0' });
}

export async function compile (force: boolean, env: PolarRuntimeEnvironment): Promise<void> {
  await assertDir(CACHE_DIR);
  const paths = readdirSync(CONTRACTS_DIR);

  // Only one contract in the contracts dir and compile in contarcts dir only
  if (paths.includes("Cargo.toml")) {
    console.log(`Cargo is here`);
    compileContract(CONTRACTS_DIR);
    createArtifacts(TARGET_DIR, ARTIFACTS_DIR);

    return;
  }

  // Multiple coontracts and each should be compiled by going inside each of them
  for (const p of paths.sort(cmpStr)) {
    const f = path.basename(p);
    const contractAbsPath = path.resolve(CONTRACTS_DIR, f);
    compileContract(contractAbsPath);
  }
  createArtifacts(TARGET_DIR, ARTIFACTS_DIR);
}
