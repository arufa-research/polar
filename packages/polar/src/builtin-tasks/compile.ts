import { boolean } from "../../src/internal/core/params/argument-types";
import { task } from "../internal/core/config/config-env";
import { canCompile } from "../lib/compile/checkEnv";
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
    .addFlag("skipSchema", "do not generate schema at compile")
    .setAction(compileTask);
}

export interface TaskArgs {
  docker: boolean
  sourceDir: string[]
  force: boolean
  skipSchema: boolean
}

async function compileTask (
  { docker, sourceDir, force, skipSchema }: TaskArgs,
  env: PolarRuntimeEnvironment
): Promise<void> {
  // check if proper version of rust wasm compiler is installed
  // If not, install it
  if (!(await canCompile(env))) {
    process.exit(1);
  }

  return await compile(docker, sourceDir, force, skipSchema);
}
