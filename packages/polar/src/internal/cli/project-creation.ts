import chalk from "chalk";
import fsExtra from "fs-extra";
import os from "os";
import path from "path";

import { POLAR_NAME } from "../../lib/contants";
import { PolarError } from "../core/errors";
import { ERRORS } from "../core/errors-list";
import { ExecutionMode, getExecutionMode } from "../core/execution-mode";
import { getPackageJson, getPackageRoot } from "../util/packageInfo";

const SAMPLE_PROJECT_DEPENDENCIES = [
  "chai"
];

async function printWelcomeMessage (): Promise<void> {
  const packageJson = await getPackageJson();

  console.log(
    chalk.cyan(`★ Welcome to ${POLAR_NAME} v${packageJson.version}`));
}

function copySampleProject (projectName: string): void {
  const packageRoot = getPackageRoot();
  const sampleProjDir = path.join(packageRoot, "sample-project");

  const currDir = process.cwd();
  const projectPath = path.join(currDir, projectName);
  console.log(chalk.greenBright("Initializing new project in " + projectPath + "."));

  fsExtra.copySync(sampleProjDir, projectPath, {
    // User doesn't choose the directory so overwrite should be avoided
    overwrite: false,
    filter: (src: string, dest: string) => {
      const relPath = path.relative(process.cwd(), dest);
      if (relPath === '') {
        return true;
      }
      if (path.basename(dest) === ".gitkeep") {
        return false;
      }
      if (fsExtra.pathExistsSync(dest)) {
        throw new PolarError(ERRORS.GENERAL.INIT_INSIDE_PROJECT, {
          clashingFile: relPath
        });
      }
      return true;
    }
  });
}

function printSuggestedCommands (projectName: string): void {
  const currDir = process.cwd();
  const projectPath = path.join(currDir, projectName);
  console.log(`Success! Created project at ${chalk.greenBright(projectPath)}.`);
  // TODO: console.log(`Inside that directory, you can run several commands:`);
  // list commands and respective description

  console.log(`Begin by typing:`);
  console.log(`  cd ${projectName}`);
  console.log(`  ${POLAR_NAME} help`);
  console.log(`  ${POLAR_NAME} compile`);
}

async function printPluginInstallationInstructions (): Promise<void> {
  console.log(
    `You need to install these dependencies to run the sample project:`
  );

  const cmd = await npmInstallCmd();

  console.log(`  ${cmd.join(" ")}`);
}
// eslint-disable-next-line
export async function createProject (projectName: string): Promise<any> {
  await printWelcomeMessage();

  copySampleProject(projectName);

  let shouldShowInstallationInstructions = true;

  if (await canInstallPlugin()) {
    const installedRecommendedDeps = SAMPLE_PROJECT_DEPENDENCIES.filter(
      isInstalled
    );

    if (
      installedRecommendedDeps.length === SAMPLE_PROJECT_DEPENDENCIES.length
    ) {
      shouldShowInstallationInstructions = false;
    } else if (installedRecommendedDeps.length === 0) {
      const shouldInstall = await confirmPluginInstallation();
      if (shouldInstall) {
        const installed = await installRecommendedDependencies();

        if (!installed) {
          console.warn(
            chalk.red("Failed to install the sample project's dependencies")
          );
        }

        shouldShowInstallationInstructions = !installed;
      }
    }
  }

  console.log("\n★", chalk.cyan("Project created"), "★\n");

  if (shouldShowInstallationInstructions) {
    await printPluginInstallationInstructions();
    console.log(``);
  }

  printSuggestedCommands(projectName);
}

function createConfirmationPrompt (name: string, message: string) { // eslint-disable-line @typescript-eslint/explicit-function-return-type
  return {
    type: "confirm",
    name,
    message,
    initial: "y",
    default: "(Y/n)",
    isTrue (input: string | boolean) {
      if (typeof input === "string") {
        return input.toLowerCase() === "y";
      }

      return input;
    },
    isFalse (input: string | boolean) {
      if (typeof input === "string") {
        return input.toLowerCase() === "n";
      }

      return input;
    },
    format (): string {
      const that = this as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      const value = that.value === true ? "y" : "n";

      if (that.state.submitted === true) {
        return that.styles.submitted(value);
      }

      return value;
    }
  };
}

async function canInstallPlugin (): Promise<boolean> {
  return (
    (await fsExtra.pathExists("package.json")) &&
    (getExecutionMode() === ExecutionMode.EXECUTION_MODE_LOCAL_INSTALLATION ||
      getExecutionMode() === ExecutionMode.EXECUTION_MODE_LINKED) &&
    // TODO: Figure out why this doesn't work on Win
    os.type() !== "Windows_NT"
  );
}

function isInstalled (dep: string): boolean {
  const packageJson = fsExtra.readJSONSync("package.json");
  const allDependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
    ...packageJson.optionalDependencies
  };

  return dep in allDependencies;
}

function isYarnProject (): boolean {
  return fsExtra.pathExistsSync("yarn.lock");
}

async function installRecommendedDependencies (): Promise<boolean> {
  console.log("");
  const installCmd = await npmInstallCmd();
  return await installDependencies(installCmd[0], installCmd.slice(1));
}

async function confirmPluginInstallation (): Promise<boolean> {
  const { default: enquirer } = await import("enquirer");

  let responses: {
    shouldInstallPlugin: boolean
  };

  const packageManager = isYarnProject() ? "yarn" : "npm";

  try {
    responses = await enquirer.prompt([
      createConfirmationPrompt(
        "shouldInstallPlugin",
        `Do you want to install the sample project's dependencies with ${packageManager} (${SAMPLE_PROJECT_DEPENDENCIES.join(
          " "
        )})?`
      )
    ]);
  } catch (e) {
    if (e === "") {
      return false;
    }

    throw e;
  }

  return responses.shouldInstallPlugin;
}

async function installDependencies (
  packageManager: string,
  args: string[]
): Promise<boolean> {
  const { spawn } = await import("child_process");

  console.log(`${packageManager} ${args.join(" ")}`);

  const childProcess = spawn(packageManager, args, {
    stdio: "inherit" as any // eslint-disable-line @typescript-eslint/no-explicit-any
  });

  return await new Promise<boolean>((resolve, reject) => {
    childProcess.once("close", (status) => {
      childProcess.removeAllListeners("error");

      if (status === 0) {
        resolve(true);
        return;
      }

      reject(new Error("script process returned not 0 status"));
    });

    childProcess.once("error", (status) => {
      childProcess.removeAllListeners("close");
      reject(new Error("script process returned not 0 status"));
    });
  });
}

async function npmInstallCmd (): Promise<string[]> {
  const isGlobal =
    getExecutionMode() === ExecutionMode.EXECUTION_MODE_GLOBAL_INSTALLATION;

  if (isYarnProject()) {
    const cmd = ["yarn"];
    if (isGlobal) { cmd.push("global"); }
    cmd.push("add", "--dev", ...SAMPLE_PROJECT_DEPENDENCIES);
    return cmd;
  }

  const npmInstall = ["npm", "install"];
  if (isGlobal) { npmInstall.push("--global"); }

  return [...npmInstall, "--save-dev", ...SAMPLE_PROJECT_DEPENDENCIES];
}
