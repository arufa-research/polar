import { execSync } from 'child_process';
import semver from 'semver';

export function getCargoGenerateVersion (): string | null {
  try {
    const versionData = execSync('cargo generate -V');
    const [version]: string[] = versionData.toString().split(/\s/)[1]?.trim().split('-') || [];

    return semver.valid(version);
  } catch (error) {
    return null;
  }
}

export function checkEnv ({ version }: { version: string }): string | boolean {
  const currentVersion: string | null = getCargoGenerateVersion();

  if (!currentVersion || semver.lt(currentVersion, version)) {
    return false;
  }

  return currentVersion;
}
