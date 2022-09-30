import debug from "debug";

import { PolarContext } from "../../src/internal/context";
import { loadConfigAndTasks } from "../../src/internal/core/config/config-loading";
import { PolarError } from "../../src/internal/core/errors";
import { ERRORS } from "../../src/internal/core/errors-list";
import { getEnvRuntimeArgs } from "../../src/internal/core/params/env-variables";
import { POLAR_PARAM_DEFINITIONS } from "../../src/internal/core/params/polar-params";
import { Environment } from "../../src/internal/core/runtime-env";
import { resetPolarContext } from "../../src/internal/reset";
import { NetworkConfig, PolarNetworkConfig, PolarRuntimeEnvironment, PromiseAny } from "../../src/types";

declare module "mocha" {
  interface Context {
    env: PolarRuntimeEnvironment
  }
}

let ctx: PolarContext;

export const defaultNetCfg: PolarNetworkConfig = {
  accounts: [],
  endpoint: "http://localhost:1337/",
  chainId: "local"
};

export function useEnvironment (
  beforeEachFn?: (polarRuntimeEnv: PolarRuntimeEnvironment) => PromiseAny
): void {
  beforeEach("Load environment", async function () {
    this.env = await getEnv(defaultNetCfg);
    if (beforeEachFn) {
      return await beforeEachFn(this.env);
    }
  });

  afterEach("reset builder context", function () {
    resetPolarContext();
  });
}

export async function getEnv (defaultNetworkCfg?: NetworkConfig): Promise<PolarRuntimeEnvironment> {
  if (PolarContext.isCreated()) {
    ctx = PolarContext.getPolarContext();

    // The most probable reason for this to happen is that this file was imported
    // from the config file
    if (ctx.environment === undefined) {
      throw new PolarError(ERRORS.GENERAL.LIB_IMPORTED_FROM_THE_CONFIG);
    }

    return ctx.environment;
  }

  ctx = PolarContext.createPolarContext();
  const runtimeArgs = getEnvRuntimeArgs(
    POLAR_PARAM_DEFINITIONS,
    process.env
  );

  if (runtimeArgs.verbose) {
    debug.enable("polar*");
  }

  const config = await loadConfigAndTasks(runtimeArgs);

  if (runtimeArgs.network == null) {
    throw new Error("INTERNAL ERROR. Default network should be registered in `register.ts` module");
  }

  if (defaultNetworkCfg !== undefined) {
    config.networks.default = defaultNetworkCfg;
  }

  const env = new Environment(
    config,
    runtimeArgs,
    ctx.tasksDSL.getTaskDefinitions(),
    ctx.extendersManager.getExtenders(),
    true);
  ctx.setRuntimeEnv(env);

  return env;
}
