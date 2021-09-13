import fs from "fs";
import path from "path";
import YAML from "yaml";

import { Checkpoints } from "../types";

export function loadCheckpoint (checkpointName: string): Checkpoints {
  const checkpoints = loadFromYamlFileSilent(checkpointName, { mapAsMap: false });
  for (const k of Object.keys(checkpoints)) {
    if (checkpoints[k]?.metadata) { checkpoints[k].metadata = toMap(checkpoints[k].metadata); }
  }
  return checkpoints;
}

// http://xahlee.info/js/js_object_to_map_datatype.html
export function toMap <T> (obj: {[name: string]: T}): Map<string, T> {
  const mp = new Map();
  Object.keys(obj).forEach(k => { mp.set(k, obj[k]); });
  return mp;
}

// eslint-disable-line @typescript-eslint/no-explicit-any
export function loadFromYamlFileSilent (filePath: string, options?: YAML.Options): any {
  // Try-catch is the way:
  // https://nodejs.org/docs/latest/api/fs.html#fs_fs_stat_path_options_callback
  // Instead, user code should open/read/write the file directly and
  // handle the error raised if the file is not available
  try {
    return readYAML(filePath, options);
  } catch (e) {
    return defaultYamlValue(options);
  }
}

// eslint-disable-line @typescript-eslint/no-explicit-any
function readYAML (filePath: string, options?: YAML.Options): any {
  return YAML.parse(fs.readFileSync(filePath).toString(), options);
}

// eslint-disable-line @typescript-eslint/no-explicit-any
function defaultYamlValue (options?: YAML.Options): any {
  if (options?.mapAsMap) {
    // eslint-disable-line @typescript-eslint/no-explicit-any
    return new Map<string, any>();
  }
  return {};
}

export function persistCheckpoint (contractPath: string, checkpoint: Checkpoints): void {
  const scriptDir = path.dirname(contractPath);
  fs.mkdirSync(scriptDir, { recursive: true });
  fs.writeFileSync(
    contractPath,
    YAML.stringify(checkpoint)
  );
}
