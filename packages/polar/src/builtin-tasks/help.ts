import { HelpPrinter } from "../internal/cli/help-printer";
import { task } from "../internal/core/config/config-env";
import { POLAR_PARAM_DEFINITIONS } from "../internal/core/params/polar-params";
import { getPackageJson } from "../internal/util/packageInfo";
import { PolarRuntimeEnvironment } from "../types";
import { TASK_HELP } from "./task-names";

const POLAR_NAME = "polar";
export default function (): void {
  task(TASK_HELP, "Prints this message")
    .addOptionalPositionalParam(
      "task",
      "An optional task to print more info about"
    )
    .setAction(help);
}

async function help (
  { task: taskName }: { task?: string }, env: PolarRuntimeEnvironment
): Promise<void> {
  const packageJson = await getPackageJson();
  const helpPrinter = new HelpPrinter(
    POLAR_NAME,
    packageJson.version,
    POLAR_PARAM_DEFINITIONS,
    env.tasks
  );

  if (taskName !== undefined) {
    helpPrinter.printTaskHelp(taskName);
    return;
  }

  helpPrinter.printGlobalHelp();
}
