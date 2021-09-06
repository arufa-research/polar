import { assert } from "chai";
import fs from "fs-extra";

import { createProject } from "../../src/internal/cli/project-creation";
import { ERRORS } from "../../src/internal/core/errors-list";
import { useEnvironment } from "../helpers/environment";
import { expectPolarErrorAsync } from "../helpers/errors";
import { useFixtureProject } from "../helpers/project";

describe("Init task", () => {
  useFixtureProject("init-task-project");
  useEnvironment();

  afterEach(() => {
    const paths = fs.readdirSync("./");
    for (const path of paths) {
      if (path !== "README.md") { fs.removeSync(path); }
    }
  });

  it("When directory with same name doesn't exist", async function () {
    const projectName = "testproject";
    await createProject(projectName);

    assert.isTrue(fs.existsSync(`./${projectName}`));
    assert.isTrue(fs.existsSync(`./${projectName}/polar.config.js`));
  });

  it("When directory name has special character", async function () {
    const projectName = "test-project";
    await createProject(projectName);

    assert.isTrue(fs.existsSync(`./${projectName}`));
    assert.isTrue(fs.existsSync(`./${projectName}/polar.config.js`));
  });

  it("When directory with same name exists", async function () {
    beforeEach(() => {
      fs.mkdirSync("./testproject");
    });
    await createProject("testproject");

    await expectPolarErrorAsync(
      async () => await createProject("testproject"),
      ERRORS.GENERAL.INIT_INSIDE_PROJECT
    );
  });
});
