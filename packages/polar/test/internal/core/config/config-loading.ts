import { assert } from "chai";
import path from "path";

import {
  TASK_CLEAN,
  TASK_HELP,
  TASK_INIT,
} from "../../../../src/builtin-tasks/task-names";
import { PolarContext } from "../../../../src/internal/context";
import { loadConfigAndTasks } from "../../../../src/internal/core/config/config-loading";
import { ERRORS } from "../../../../src/internal/core/errors-list";
import { resetPolarContext } from "../../../../src/internal/reset";
import { useEnvironment } from "../../../helpers/environment";
import { expectPolarErrorAsync } from "../../../helpers/errors";
import {
  getFixtureProjectPath,
  useFixtureProject
} from "../../../helpers/project";
import { account } from "../../../mocks/account";

describe("config loading", function () {
  describe("default config path", function () {
    useFixtureProject("config-project");
    useEnvironment();

    it("should load the default config if none is given", function () {
      const a: any = this.env.config.networks;
      assert.isDefined(a.localhost);
      assert.deepEqual(a.localhost.accounts, [account]);
    });
  });

  describe("Config validation", function () {
    describe("When the config is invalid", function () {
      useFixtureProject("invalid-config");

      beforeEach(function () {
        PolarContext.createPolarContext();
      });

      afterEach(function () {
        resetPolarContext();
      });

      it("Should throw the right error", function () {
        expectPolarErrorAsync(
          () => loadConfigAndTasks(),
          ERRORS.GENERAL.INVALID_CONFIG
        ).catch((err) => console.log(err));
      });
    });
  });

  describe("custom config path", function () {
    useFixtureProject("custom-config-file");

    beforeEach(function () {
      PolarContext.createPolarContext();
    });

    afterEach(function () {
      resetPolarContext();
    });

    it("should accept a relative path from the CWD", async function () {
      const config = await loadConfigAndTasks({ config: "config.js" });

      if (!config.paths) {
        assert.fail("Project was not loaded");
      }

      assert.equal(
        config.paths.configFile,
        path.normalize(path.join(process.cwd(), "config.js"))
      );
    });

    it("should accept an absolute path", async function () {
      const fixtureDir = getFixtureProjectPath("custom-config-file");
      const config = await loadConfigAndTasks({
        config: path.join(fixtureDir, "config.js")
      });

      if (!config.paths) {
        assert.fail("Project was not loaded");
      }

      assert.equal(
        config.paths.configFile,
        path.normalize(path.join(process.cwd(), "config.js"))
      );
    });
  });

  describe("Tasks loading", function () {
    useFixtureProject("config-project");
    useEnvironment();

    it("Should define the default tasks", function () {
      assert.containsAllKeys(this.env.tasks, [
        TASK_CLEAN,
        TASK_INIT,
        TASK_HELP
      ]);
    });

    it("Should load custom tasks", function () {
      assert.containsAllKeys(this.env.tasks, ["example"]);
    });
  });

  describe("Config env", function () {
    useFixtureProject("config-project");

    afterEach(function () {
      resetPolarContext();
    });

    it("should remove everything from global state after loading", async function () {
      const globalAsAny: any = global;

      PolarContext.createPolarContext();
      await loadConfigAndTasks();

      assert.isUndefined(globalAsAny.internalTask);
      assert.isUndefined(globalAsAny.task);
      assert.isUndefined(globalAsAny.types);
      assert.isUndefined(globalAsAny.extendEnvironment);
      assert.isUndefined(globalAsAny.usePlugin);

      resetPolarContext();

      PolarContext.createPolarContext();
      await loadConfigAndTasks();

      assert.isUndefined(globalAsAny.internalTask);
      assert.isUndefined(globalAsAny.task);
      assert.isUndefined(globalAsAny.types);
      assert.isUndefined(globalAsAny.extendEnvironment);
      assert.isUndefined(globalAsAny.usePlugin);
      resetPolarContext();
    });
  });

});
