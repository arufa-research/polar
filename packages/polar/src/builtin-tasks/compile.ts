import { readdirSync } from 'fs';
import path from "path";

import { task } from "../internal/core/config/config-env";
import { assertDir, CACHE_DIR, CONTRACTS_DIR } from "../internal/core/project-structure";
import { cmpStr } from "../internal/util/strings";
import type { PolarRuntimeEnvironment } from "../types";
import { TASK_COMPILE } from "./task-names";

export default function (): void {
  task(TASK_COMPILE, "Compile all TEAL smart contracts")
    .addFlag("force", "recompile even if the source file didn't change")
    .setAction(compileTask);
}

export interface TaskArgs {
  force: boolean
}

function compileTask ({ force }: TaskArgs, env: PolarRuntimeEnvironment): Promise<void> {
  const op = "class object";
  return compile(force, op);
}

export async function compile (force: boolean, op: any): Promise<void> {
  await assertDir(CACHE_DIR);
  const paths = readdirSync(CONTRACTS_DIR);

  for (const p of paths.sort(cmpStr)) {
    const f = path.basename(p);
    // class with each filename
  }
}
