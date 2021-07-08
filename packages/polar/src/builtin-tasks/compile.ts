import { boolean } from "../../src/internal/core/params/argument-types";
import { task } from "../internal/core/config/config-env";
import { checkEnv } from "../lib/compile/checkEnv";
import { compile } from "../lib/compile/compile";
import type { PolarRuntimeEnvironment } from "../types";
import { TASK_COMPILE } from "./task-names";

export default function (): void {
  task(TASK_COMPILE, "Compile all secret contracts")
    .addOptionalParam("docker", "Compiling with docker", false, boolean)
    .addOptionalVariadicPositionalParam(
      "sourceDir",
      "Path for a specific contract to compile",
      []
    )
    .addFlag("force", "recompile even if the source file didn't change")
    .setAction(compileTask);
}

export interface TaskArgs {
  docker: boolean
  sourceDir: string[]
  force: boolean
}

function compileTask (
  { docker, sourceDir, force }: TaskArgs,
  env: PolarRuntimeEnvironment
): Promise<void> {
  if (!canCompile(env)) { // check if proper version of rust wasm compiler is installed
    process.exit(1);
  }

  return compile(docker, sourceDir, force, env);
}

function canCompile (env: PolarRuntimeEnvironment): boolean {
  return checkEnv({ rustcVersion: '1.50.0', cargoVersion: '1.50.0' });
}
