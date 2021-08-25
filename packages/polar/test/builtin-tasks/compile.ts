import { assert, expect } from "chai";
import fs from "fs-extra";
import path from "path";

import { ERRORS } from "../../src/internal/core/errors-list";
import { compile } from "../../src/lib/compile/compile";
import { PolarRuntimeEnvironment } from "../../src/types";
import { getEnv, useEnvironment } from "../helpers/environment";
import { expectErrorAsync } from "../helpers/errors";
import { getFixtureProjectPath, useFixtureProject } from "../helpers/project";

function assertCompile (
  projectName: string,
  sourceDir: string[],
  hasErrors: boolean,
  multi: boolean
): void {
  it("Should create .wasm files if no hasErrors is false", async function () {
    const projectPath: string = path.join(getFixtureProjectPath("compile-task-project"), projectName);
    process.chdir(projectPath);
    if (!hasErrors) {
      await compile(false, sourceDir, false);

      if (multi) {
        for (const contract of fs.readdirSync("./contracts")) {
          const contractName = path.basename(contract);
          assert.isTrue(fs.existsSync(`./artifacts/contracts/${contractName}/sample_project.wasm`));
        }
      } else {
        assert.isTrue(fs.existsSync(`./artifacts/contracts/sample_project.wasm`));
      }
    } else if (hasErrors) {
      // check for Exception
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      assert.throws(async () => await compile(false, sourceDir, false));
    }

    afterEach(() => {
      fs.removeSync("./artifacts");
    });
  }).timeout(100000);
}

describe("Compile task", () => {
  describe("Compile simple contract", function () {
    assertCompile("testproject", [], false, false);
  });

  describe("Compile multi contract", function () {
    assertCompile("multiproject", [], false, true);
  });

  describe("Compile by providing sourceDir", function () {
    assertCompile("testproject", ["contracts/"], false, false);
  });

  // describe("Compile fail when contract has compile errors", function () {
  //   assertCompile("errorproject", [], true, false);
  // });
});
