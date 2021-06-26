import { assert } from "chai";

import { ERRORS } from "../../../../src/internal/core/errors-list";
import {
  getEnvRuntimeArgs,
  getEnvVariablesMap,
  paramNameToEnvVariable
} from "../../../../src/internal/core/params/env-variables";
import { POLAR_PARAM_DEFINITIONS } from "../../../../src/internal/core/params/polar-params";
import { expectPolarError } from "../../../helpers/errors";

describe("paramNameToEnvVariable", () => {
  it("should convert camelCase to UPPER_CASE and prepend POLAR_", () => {
    assert.equal(paramNameToEnvVariable("a"), "POLAR_A");
    assert.equal(paramNameToEnvVariable("B"), "POLAR_B");
    assert.equal(paramNameToEnvVariable("AC"), "POLAR_A_C");
    assert.equal(paramNameToEnvVariable("aC"), "POLAR_A_C");
    assert.equal(
      paramNameToEnvVariable("camelCaseRight"),
      "POLAR_CAMEL_CASE_RIGHT"
    );
    assert.equal(
      paramNameToEnvVariable("somethingAB"),
      "POLAR_SOMETHING_A_B"
    );
  });
});

describe("Env vars arguments parsing", () => {
  it("Should use the default values if arguments are not defined", () => {
    const args = getEnvRuntimeArgs(POLAR_PARAM_DEFINITIONS, {
      IRRELEVANT_ENV_VAR: "123"
    });
    assert.equal(args.help, POLAR_PARAM_DEFINITIONS.help.defaultValue);
    assert.equal(args.network, POLAR_PARAM_DEFINITIONS.network.defaultValue);
    assert.equal(
      args.showStackTraces,
      POLAR_PARAM_DEFINITIONS.showStackTraces.defaultValue
    );
    assert.equal(args.version, POLAR_PARAM_DEFINITIONS.version.defaultValue);
  });

  it("Should accept values", () => {
    const args = getEnvRuntimeArgs(POLAR_PARAM_DEFINITIONS, {
      IRRELEVANT_ENV_VAR: "123",
      POLAR_NETWORK: "asd",
      POLAR_SHOW_STACK_TRACES: "true",
      POLAR_VERSION: "true",
      POLAR_HELP: "true"
    });

    assert.equal(args.network, "asd");

    // These are not really useful, but we test them anyway
    assert.equal(args.showStackTraces, true);
    assert.equal(args.version, true);
    assert.equal(args.help, true);
  });

  it("should throw if an invalid value is passed", () => {
    expectPolarError(
      () =>
        getEnvRuntimeArgs(POLAR_PARAM_DEFINITIONS, {
          POLAR_HELP: "123"
        }),
      ERRORS.ARGUMENTS.INVALID_ENV_VAR_VALUE
    );
  });
});

describe("getEnvVariablesMap", () => {
  it("Should return the right map", () => {
    assert.deepEqual(
      getEnvVariablesMap({
        network: "asd",
        help: true,
        showStackTraces: true,
        version: false,
        verbose: true,
        config: undefined // config is optional
      }),
      {
        POLAR_NETWORK: "asd",
        POLAR_HELP: "true",
        POLAR_SHOW_STACK_TRACES: "true",
        POLAR_VERSION: "false",
        POLAR_VERBOSE: "true"
      }
    );
  });
});
