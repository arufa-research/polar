import { assert, expect } from "chai";
import fs from "fs-extra";
import path from "path";

import { ERRORS } from "../../src/internal/core/errors-list";
import { compile } from "../../src/lib/compile/compile";
import { PolarRuntimeEnvironment } from "../../src/types";
import { getEnv, useEnvironment } from "../helpers/environment";
import { expectErrorAsync } from "../helpers/errors";
import { getFixtureProjectPath, useFixtureProject } from "../helpers/project";

async function assertCompile (projectName: string, sourceDir: string[], hasErrors: boolean):
Promise<void> {
  const env: PolarRuntimeEnvironment = await getEnv();

  it("Should create .wasm files if no hasErrors is false", async function () {
    const projectPath: string = path.join(getFixtureProjectPath("compile-task-project"), projectName);
    process.chdir(projectPath);
    if (!hasErrors) {
      await compile(false, sourceDir, false, env);

      assert.isTrue(fs.existsSync(`./artifacts/contracts/sample_project.wasm`));
    } else if (hasErrors) {
      // check for Exception
      // expect(
      //   async () => await compile(false, sourceDir, false, env)
      // ).to.throw();
      // await expectErrorAsync(
      //   async() => ,
      //   Error
      // )
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      assert.throws(async () => await compile(false, sourceDir, false, env));
    }

    afterEach(() => {
      fs.removeSync("./artifacts");
      fs.removeSync("./contracts/target/");
    });
  }).timeout(50000);
}

describe("Compile task", () => {
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  describe("Compile simple contract", async function () {
    await assertCompile("testproject", [], false);
  });

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  describe("Compile multi contract", async function () {
    await assertCompile("multiproject", [], false);
  });

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  describe("Compile by providing sourceDir", async function () {
    await assertCompile("testproject", ["contracts/"], false);
  });

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  describe("Compile fail when contract has compile errors", async function () {
    await assertCompile("errorproject", [], true);
  });
});
