import debug from "debug";
import fsExtra from "fs-extra";

import { task } from "../internal/core/config/config-env";
import { PolarError } from "../internal/core/errors";
import { ERRORS } from "../internal/core/errors-list";
import { SCRIPTS_DIR } from "../internal/core/project-structure";
import { runScript } from "../internal/util/script-runner";
import { assertDirChildren } from "../lib/files";
import { PolarRuntimeEnvironment } from "../types";
import { TASK_RUN } from "./task-names";

interface Input {
  scripts: string[]
}

export function filterNonExistent (scripts: string[]): string[] {
  return scripts.filter(script => !fsExtra.pathExistsSync(script));
}

async function runScripts (
  runtimeEnv: PolarRuntimeEnvironment,
  scriptNames: string[],
  force: boolean,
  logDebugTag: string,
  allowWrite: boolean
): Promise<void> {
  const log = debug(logDebugTag);

  // force boolean will be used when we have checkpoint support

  for (const relativeScriptPath of scriptNames) {
    log(`Running script ${relativeScriptPath}`);
    await runScript(
      relativeScriptPath,
      runtimeEnv
    );
  }
}

async function executeRunTask (
  { scripts }: Input,
  runtimeEnv: PolarRuntimeEnvironment
  // eslint-disable-next-line
): Promise<any> {
  const logDebugTag = "polar:tasks:run";

  const nonExistent = filterNonExistent(scripts);
  if (nonExistent.length !== 0) {
    throw new PolarError(ERRORS.BUILTIN_TASKS.RUN_FILES_NOT_FOUND, {
      scripts: nonExistent
    });
  }

  await runScripts(
    runtimeEnv,
    assertDirChildren(SCRIPTS_DIR, scripts),
    true,
    logDebugTag,
    false
  );
}

export default function (): void {
  task(TASK_RUN, "Runs a user-defined script after compiling the project")
    .addVariadicPositionalParam(
      "scripts",
      "A js file to be run within polar's environment"
    )
    .setAction((input, env) => executeRunTask(input, env));
}
