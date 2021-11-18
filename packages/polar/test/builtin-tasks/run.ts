import { assert } from "chai";
import fs from "fs";

import { TASK_RUN } from "../../src/builtin-tasks/task-names";
import { ERRORS } from "../../src/internal/core/errors-list";
import { testFixtureOutputFile } from "../helpers/constants";
import { useEnvironment } from "../helpers/environment";
import { expectPolarErrorAsync } from "../helpers/errors";
import { useCleanFixtureProject, useFixtureProject } from "../helpers/project";

const script1 = "scripts/1.js";
const script2 = "scripts/2.js";

describe("Run task", function () {
  useFixtureProject("project-with-scripts");
  useEnvironment();

  it("Should fail if a script doesn't exist", async function () {
    await expectPolarErrorAsync(
      async () => await this.env.run(TASK_RUN, {
        scripts: ["./scripts/does-not-exist"]
      }),
      ERRORS.BUILTIN_TASKS.RUN_FILES_NOT_FOUND,
      "./scripts/does-not-exist"
    );
  });

  it("Should run the scripts to completion", async function () {
    await this.env.run(TASK_RUN, {
      scripts: ["./scripts/async-script.js"]
    });
  });
});

describe("Run task + clean", function () {
  useCleanFixtureProject("scripts-dir");
  useEnvironment();

  it("Should allow to run multiple scripts", async function () {
    await this.env.run(TASK_RUN, {
      scripts: [script2, script1]
    });
    const scriptOutput = fs.readFileSync(testFixtureOutputFile).toString();
    assert.equal(scriptOutput, `scripts directory: script 2 executed
scripts directory: script 1 executed
`);
  });

  it("Should fail if any nonexistent scripts are passed", async function () {
    await expectPolarErrorAsync(
      async () =>
        await this.env.run(TASK_RUN, {
          scripts: [script1, script2, "scripts/3.js"]
        }),
      ERRORS.BUILTIN_TASKS.RUN_FILES_NOT_FOUND,
      "scripts/3.js"
    );
  });

  // it("Should return the script's status code on failure", async function () {
  //   await expectPolarErrorAsync(
  //     async () =>
  //       await this.env.run(TASK_RUN, {
  //         scripts: ["scripts/other-scripts/1.js",
  //           "scripts/other-scripts/failing.js", "scripts/1.js"]
  //       }),
  //     ERRORS.BUILTIN_TASKS.RUN_FILES_NOT_FOUND,
  //     "scripts/other-scripts/failing.js"
  //   );
  //   const scriptOutput = fs.readFileSync(testFixtureOutputFile).toString();
  //   assert.equal(scriptOutput, "other scripts directory: script 1 executed\n");
  // });

  it("Should allow to rerun successful scripts twice", async function () {
    await this.env.run(TASK_RUN, {
      scripts: [script2, script1]
    });
    await this.env.run(TASK_RUN, {
      scripts: [script1, script2]
    });
    const scriptOutput = fs.readFileSync(testFixtureOutputFile).toString();
    assert.equal(scriptOutput, `scripts directory: script 2 executed
scripts directory: script 1 executed
scripts directory: script 1 executed
scripts directory: script 2 executed
`);
  });

  it("Should not create a snapshot", async function () {
    await this.env.run(TASK_RUN, {
      scripts: [script2]
    });
    assert.isFalse(fs.existsSync("artifacts/scripts/2.js"));
  });

  it("Should not allow scripts outside of scripts dir", async function () {
    await expectPolarErrorAsync(
      async () =>
        await this.env.run(TASK_RUN, {
          scripts: ["1.js", script2, script1]
        }),
      ERRORS.BUILTIN_TASKS.SCRIPTS_OUTSIDE_SCRIPTS_DIRECTORY,
      "1.js"
    );
  });
});
