import { assert } from "chai";
import fs from "fs-extra";
import path from "path";

import { ERRORS } from "../../src/internal/core/errors-list";
import { compile } from "../../src/lib/compile/compile";
import { expectPolarErrorAsync } from "../helpers/errors";
import { useFixtureProject } from "../helpers/project";

describe("Compile task", () => {
  afterEach(() => {
    fs.removeSync("./artifacts");
  });
  describe("Compile simple contract", function () {
    useFixtureProject("testproject");
    it("Should create .wasm files", async function () {
      await compile(false, [], false);

      assert.isTrue(fs.existsSync(`./artifacts/contracts/sample_project.wasm`));
    }).timeout(200000);
  });

  describe("Compile multi contract", function () {
    useFixtureProject("multiproject");
    it("Should create .wasm files for  each contract", async function () {
      await compile(false, [], false);

      assert.isTrue(fs.existsSync(`./artifacts/contracts/sample_project.wasm`));
      assert.isTrue(fs.existsSync(`./artifacts/contracts/sample_project_1.wasm`));
    }).timeout(200000);
  });

  describe("Compile by providing sourceDir", function () {
    useFixtureProject("testproject");
    it("Should create .wasm files of only given contract in sourceDir", async function () {
      await compile(false, ["contracts/"], false);

      assert.isTrue(fs.existsSync(`./artifacts/contracts/sample_project.wasm`));
    }).timeout(200000);
  });

  describe("Compile fail when contract has compile errors", function () {
    useFixtureProject("errorproject");
    it("Should raise Polar error", async function () {
      // check for Exception
      await expectPolarErrorAsync(
        async () => await compile(false, [], false),
        ERRORS.GENERAL.RUST_COMPILE_ERROR
      );
    }).timeout(200000);
  });
});
