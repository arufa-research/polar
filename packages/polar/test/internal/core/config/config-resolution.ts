import { assert } from "chai";
import * as path from "path";

import { PolarContext } from "../../../../src/internal/context";
import { loadConfigAndTasks } from "../../../../src/internal/core/config/config-loading";
import { resolveProjectPaths } from "../../../../src/internal/core/config/config-resolution";
import { resetPolarContext } from "../../../../src/internal/reset";
import { HttpNetworkConfig, PolarNetworkAccountConfig, PolarNetworkConfig, PolarNetworkUserConfig, UserPaths } from "../../../../src/types";
import { useFixtureProject } from "../../../helpers/project";
import { account } from "../../../mocks/account";

describe("Config resolution", () => {
  beforeEach(() => {
    PolarContext.createPolarContext();
  });

  afterEach(() => {
    resetPolarContext();
  });

  describe("Default config merging", () => {
    describe("With custom config", () => {
      useFixtureProject("config-project");

      it("should return the config merged ", async () => {
        const config = await loadConfigAndTasks();

        assert.containsAllKeys(config.networks, ["localhost", "custom"]);
      });

      it("should return the config merged ", async () => {
        const config = await loadConfigAndTasks();
        assert.containsAllKeys(config.networks, ["localhost", "custom"]);
        const ncfg = config.networks.localhost as PolarNetworkUserConfig;
        assert.equal(ncfg.endpoint, "http://127.0.0.1");
        assert.deepEqual(config.networks.localhost.accounts, [account]);
      });

      it("should keep any unknown field", async () => {
        const config = await loadConfigAndTasks() as any;
        assert.deepEqual(config.unknown, { asd: 123 });
      });
    });
  });

  describe("Paths resolution", () => {
    const cfg: UserPaths = {};
    it("Should return absolute paths", () => {
      const paths = resolveProjectPaths(__filename, cfg);
      const pathVals: string[] = Object.values(paths);
      pathVals.forEach((p) => assert.isTrue(path.isAbsolute(p)));
    });

    it("Should use absolute paths 'as is'", () => {
      const paths = resolveProjectPaths(__filename, {
        root: "/root",
        sources: "/c",
        artifacts: "/a",
        cache: "/ca",
        tests: "/t"
      });

      assert.equal(paths.root, "/root");
      assert.equal(paths.sources, "/c");
      assert.equal(paths.artifacts, "/a");
      assert.equal(paths.cache, "/ca");
      assert.equal(paths.tests, "/t");
    });

    it("Should resolve the root relative to the configFile", () => {
      const paths = resolveProjectPaths(__filename, {
        root: "blah"
      });

      assert.equal(paths.root, path.join(__dirname, "blah"));
    });

    it("Should resolve the rest relative to the root", () => {
      const paths = resolveProjectPaths(__filename, {
        root: "blah",
        sources: "c",
        artifacts: "a",
        cache: "ca",
        tests: "t"
      });

      const root = path.join(__dirname, "blah");
      assert.equal(paths.root, root);
      assert.equal(paths.sources, path.join(root, "c"));
      assert.equal(paths.artifacts, path.join(root, "a"));
      assert.equal(paths.cache, path.join(root, "ca"));
      assert.equal(paths.tests, path.join(root, "t"));
    });

    it("Should have the right default values", () => {
      const paths = resolveProjectPaths(__filename);
      assert.equal(paths.root, __dirname);
      assert.equal(paths.sources, path.join(__dirname, "contracts"));
      assert.equal(paths.artifacts, path.join(__dirname, "artifacts"));
      assert.equal(paths.cache, path.join(__dirname, "cache"));
      assert.equal(paths.tests, path.join(__dirname, "test"));
    });
  });
});
