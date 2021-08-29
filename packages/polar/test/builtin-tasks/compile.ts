import { assert, expect } from "chai";
import fs from "fs-extra";
import path from "path";

import { ERRORS } from "../../src/internal/core/errors-list";
import { compile } from "../../src/lib/compile/compile";
import { PolarRuntimeEnvironment } from "../../src/types";
import { getEnv, useEnvironment } from "../helpers/environment";
import { expectErrorAsync, expectPolarErrorAsync } from "../helpers/errors";
import { getFixtureProjectPath, useFixtureProject } from "../helpers/project";

describe("Compile task", () => {
  useFixtureProject("compile-task-project");
  afterEach(() => {
    fs.removeSync("./artifacts");
    process.chdir("../");
  });
  describe("Compile simple contract", function () {
    it("Should create .wasm files", async function () {
      process.chdir("./testproject");
      await compile(false, [], false);

      assert.isTrue(fs.existsSync(`./artifacts/contracts/sample_project.wasm`));
    }).timeout(100000);
  });

  describe("Compile multi contract", function () {
    it("Should create .wasm files for  each contract", async function () {
      process.chdir("./multiproject");
      await compile(false, [], false);

      for (const contract of fs.readdirSync("./contracts")) {
        const contractName = path.basename(contract);
        assert.isTrue(fs.existsSync(`./artifacts/contracts/${contractName}/sample_project.wasm`));
      }
    }).timeout(100000);
  });

  describe("Compile by providing sourceDir", function () {
    it("Should create .wasm files of only given contract in sourceDir", async function () {
      process.chdir("./testproject");
      await compile(false, ["contracts/"], false);

      assert.isTrue(fs.existsSync(`./artifacts/contracts/sample_project.wasm`));
    }).timeout(100000);
  });

  describe("Compile fail when contract has compile errors", function () {
    it("Should raise Polar error", async function () {
      process.chdir("./errorproject");
      // check for Exception
      await expectPolarErrorAsync(
        async () => await compile(false, [], false),
        ERRORS.GENERAL.RUST_COMPILE_ERROR
      );
    }).timeout(100000);
  });
});
