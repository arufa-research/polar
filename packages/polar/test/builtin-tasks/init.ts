import { assert, expect } from "chai";
import * as child from "child_process";
import * as fs from "fs";

import { createProject } from "../../src/internal/cli/project-creation";
import { ERRORS } from "../../src/internal/core/errors-list";
import { useEnvironment } from "../helpers/environment";
import { expectPolarError, expectPolarErrorAsync } from "../helpers/errors";
import { useFixtureProject } from "../helpers/project";

function assertInit (projectName: string, dirExists: boolean): void {
  it("Should create project directory if not present", async function () {
    if (!dirExists) {
      await createProject(projectName);

      assert.isTrue(fs.existsSync(`./${projectName}`));
      assert.isTrue(fs.existsSync(`./${projectName}/polar.config.js`));
    } else if (dirExists) {
      // check for Exception
      await expectPolarErrorAsync(
        async () => await createProject(projectName),
        ERRORS.GENERAL.INIT_INSIDE_PROJECT
      );
    }
  });
}

describe("Init task", () => {
  useFixtureProject("init-task-project");
  useEnvironment();

  afterEach(() => {
    child.execSync("rm -rf ./*");
  });

  describe("When directory with same name doesn't exist", function () {
    assertInit("testproject", false);
  });

  describe("When directory name has special character", function () {
    assertInit("test-project", false);
  });

  describe("When directory with same name exists", function () {
    beforeEach(() => {
      fs.mkdirSync("./testproject");
    });

    assertInit("testproject", true);
  });
});
