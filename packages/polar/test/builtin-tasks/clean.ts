import { assert } from "chai";
import fs from "fs-extra";

import contractName from "../../src/builtin-tasks/clean";
import { TASK_CLEAN } from "../../src/builtin-tasks/task-names";
import { ERRORS } from "../../src/internal/core/errors-list";
import { ARTIFACTS_DIR, isCwdProjectDir } from "../../src/internal/core/project-structure";
import { compile } from "../../src/lib/compile/compile";
import { useEnvironment } from "../helpers/environment";
import { expectPolarErrorAsync } from "../helpers/errors";
import { useFixtureProject } from "../helpers/project";

describe("Clean task", () => {
  useFixtureProject("testproject");
  useEnvironment();

  afterEach(() => {
    fs.removeSync(`./${ARTIFACTS_DIR}`);
  });

  it("When contract name is not specified", async function () {
    await compile(false, [], false);
    await this.env.run(TASK_CLEAN, {});

    assert.isFalse(fs.existsSync(`./${ARTIFACTS_DIR}`));
  });

  it("When there is no Artifacts directory", async function () {
    await expectPolarErrorAsync(
      async () => await this.env.run(TASK_CLEAN, {}),
      ERRORS.GENERAL.ARTIFACTS_NOT_FOUND
    );
  });

  it("When contract name specified is incorrect", async function () {
    await compile(false, [], false);

    await expectPolarErrorAsync(
      async () => await this.env.run(TASK_CLEAN, { contractName: "sample-project1" }),
      ERRORS.GENERAL.INCORRECT_CONTRACT_NAME
    );
  });

  it("When contract name is specified", async function () {
    await compile(false, [], false);
    await this.env.run(TASK_CLEAN, { contractName: "sample-project" });
    const contractName = 'sample-project';
    assert.isFalse(fs.existsSync(`./${ARTIFACTS_DIR}/contracts/sample-project.wasm`));
    assert.isFalse(fs.existsSync(`./${ARTIFACTS_DIR}/schema/sample-project`));
    assert.isFalse(fs.existsSync(`./${ARTIFACTS_DIR}/checkpoints/sample-project.yaml`));
  });
});
