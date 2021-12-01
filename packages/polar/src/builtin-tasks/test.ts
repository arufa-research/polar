import debug from "debug";
import fsExtra from "fs-extra";

import { task } from "../internal/core/config/config-env";
import { PolarError } from "../internal/core/errors";
import { ERRORS } from "../internal/core/errors-list";
import { TESTS_DIR } from "../internal/core/project-structure";
import { runScript } from "../internal/util/script-runner";
import { assertDirChildren } from "../lib/files";
import { PolarRuntimeEnvironment } from "../types";
import { TASK_TEST } from "./task-names";

interface Input {
  tests: string[]
}

export function filterNonExistent (scripts: string[]): string[] {
  return scripts.filter(script => !fsExtra.pathExistsSync(script));
}

async function runTests (
  runtimeEnv: PolarRuntimeEnvironment,
  scriptNames: string[],
  logDebugTag: string
): Promise<void> {
  const log = debug(logDebugTag);

  for (const relativeScriptPath of scriptNames) {
    log(`Running test ${relativeScriptPath}`);
    await runScript(
      relativeScriptPath,
      runtimeEnv
    );
  }
}

async function executeTestTask (
  { tests }: Input,
  runtimeEnv: PolarRuntimeEnvironment
  // eslint-disable-next-line
): Promise<any> {
  const logDebugTag = "polar:tasks:run";

  const nonExistent = filterNonExistent(tests);
  if (nonExistent.length !== 0) {
    throw new PolarError(ERRORS.BUILTIN_TASKS.RUN_FILES_NOT_FOUND, {
      scripts: nonExistent
    });
  }

  await runTests(
    runtimeEnv,
    assertDirChildren(TESTS_DIR, tests),
    logDebugTag
  );
}

export default function (): void {
  task(TASK_TEST, "Runs a user-defined test script after compiling the project")
    .addOptionalVariadicPositionalParam(
      "tests",
      "A js file to be run within polar's environment"
    )
    .setAction((input, env) => executeTestTask(input, env));
}
