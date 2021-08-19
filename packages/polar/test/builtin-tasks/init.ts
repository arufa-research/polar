import { assert, expect } from "chai";
import * as fs from "fs";

// import { TASK_INIT } from "../../src/builtin-tasks/task-names";
import { createProject } from "../../src/internal/cli/project-creation";
import { useEnvironment } from "../helpers/environment";
import { useFixtureProject } from "../helpers/project";

function assertInit (projectName: string, dirExists: boolean): void {
  it("Should create project directory if not present", async function () {
    await createProject(projectName);

    assert.isTrue(fs.existsSync(`./${projectName}`));
    if (!dirExists) {
      assert.isTrue(fs.existsSync(`./${projectName}/polar.config.js`));
    } else if (dirExists) {
      assert.isFalse(fs.existsSync(`./${projectName}/polar.config.js`));
    }
  });
}

describe("Init task", () => {
  useFixtureProject("task-project");
  useEnvironment();

  describe("When directory with same name doesn't exist", function () {
    assertInit("testproject", false);
  });

  describe("When directory name has special character", function () {
    assertInit("test-project", false);
  });
});
