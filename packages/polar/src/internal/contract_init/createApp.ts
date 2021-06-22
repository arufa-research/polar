import chalk from 'chalk';
import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';

export function initProject (projectName: string): void {
  const currentNodeVersion = process.versions.node;

  if (+currentNodeVersion.split('.')[0] < 10) {
    console.error(
    `You are running Node ${currentNodeVersion}. \nPolar requires Node 10 or higher. \nPlease update your version of Node.`
    );
    process.exit(1);
  }

  createApp(projectName);
}

function createApp (name: string): void {
  const root = path.resolve(name);

  if (!isSafeToCreateApp(root, name)) {
    process.exit(1);
  }

  const gitRepo = "https://github.com/arufa-research/secret-template.git";
  execSync(`cargo generate --git ${gitRepo} --name ${name}`, { stdio: 'inherit' });
}

function isSafeToCreateApp (root: string, name: string): boolean {
  if (fs.existsSync(root)) {
    console.log(`The directory ${chalk.green(name)} already exists.`);
    console.log();
    console.log(`Try using a new directory name.`);

    return false;
  } else {
    return true;
  }
}
