import findup from 'find-up';
import fsExtra from 'fs-extra';
import path from 'path';

export function getPackageJsonPath (): string {
  // eslint-disable-next-line  @typescript-eslint/no-non-null-assertion
  return findClosestPackageJson(__filename)!;
}

export function getPackageRoot (): string {
  const packageJsonPath = getPackageJsonPath();

  return path.dirname(packageJsonPath);
}

export interface PackageJson {
  name: string
  version: string
  engines: {
    node: string
  }
}

export function findClosestPackageJson (file: string): string | null {
  return findup.sync('package.json', { cwd: path.dirname(file) }) ?? null;
}

export async function getPackageJson (): Promise<PackageJson> {
  const root = getPackageRoot();
  // eslint-disable-next-line
  return await fsExtra.readJSON(path.join(root, 'package.json'));
}

export function getPolarVersion (): string | null {
  const packageJsonPath = findClosestPackageJson(__filename);

  if (packageJsonPath === null) {
    return null;
  }

  try {
    const packageJson = fsExtra.readJsonSync(packageJsonPath);

    return packageJson.version;
  } catch (e) {
    return null;
  }
}
