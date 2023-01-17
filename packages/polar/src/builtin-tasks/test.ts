import chalk from "chalk";
import fsExtra from "fs-extra";
import path from "path";
import * as ts from "typescript";

import { task } from "../internal/core/config/config-env";
import { PolarError } from "../internal/core/errors";
import { ERRORS } from "../internal/core/errors-list";
import { TESTS_DIR } from "../internal/core/project-structure";
import { buildTsScripts } from "../lib/compile/scripts";
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
  const { default: Mocha } = await import('mocha');
  const mocha = new Mocha(runtimeEnv.config.mocha);

  for (const file of scriptNames) {
    let relativeFilePath = file;
    if (file.endsWith('.ts')) {
      relativeFilePath = path.join('build', file.split('.ts')[0] + '.js');
    }
    mocha.addFile(relativeFilePath);
  }
  const testFailures = await new Promise<number>((resolve, reject) => {
    mocha.run(resolve);
  });

  process.exitCode = testFailures;
}

async function executeTestTask (
  { tests }: Input,
  runtimeEnv: PolarRuntimeEnvironment
): Promise<void> {
  const logDebugTag = "polar:tasks:test";

  const currDir = process.cwd();

  if (tests === undefined) {
    tests = [];
    for (const file of fsExtra.readdirSync(TESTS_DIR)) {
      if (file.endsWith('.ts') || file.endsWith('.js')) {
        const relativeFilePath = path.join(TESTS_DIR, file);
        tests.push(relativeFilePath);
      }
    }
    console.log(`Reading test files in ${chalk.cyan(TESTS_DIR)} directory`);
    console.log(`Found ${tests.length} test files: ${chalk.green(tests)}`);
  }

  const nonExistent = filterNonExistent(tests);
  if (nonExistent.length !== 0) {
    throw new PolarError(ERRORS.BUILTIN_TASKS.RUN_FILES_NOT_FOUND, {
      scripts: nonExistent
    });
  }

  await buildTsScripts(
    tests,
    {
      baseUrl: currDir,
      paths: {
        "*": [
          "node_modules/*"
        ]
      },
      target: ts.ScriptTarget.ES2020,
      outDir: path.join(currDir, "build"),
      experimentalDecorators: true,
      esModuleInterop: true,
      allowJs: true,
      module: ts.ModuleKind.CommonJS,
      resolveJsonModule: true,
      noImplicitReturns: true,
      noImplicitThis: true,
      strict: true,
      forceConsistentCasingInFileNames: true,
      sourceMap: true,
      declaration: true
    }
  );

  runtimeEnv.runtimeArgs.command = "test"; // used by Contract() class to skip artifacts
  runtimeEnv.runtimeArgs.useCheckpoints = false;

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
