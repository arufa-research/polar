/* eslint-disable */
import { assert } from "chai";

import { ErrorDescriptor, ERRORS } from "../../../src/internal/core/errors-list";
import { ArgumentsParser } from "../../../src/internal/cli/arguments-parser";
import {
  boolean,
  int,
  string
} from "../../../src/internal/core/params/argument-types";
import {
  POLAR_PARAM_DEFINITIONS,
  POLAR_SHORT_PARAM_SUBSTITUTIONS
} from "../../../src/internal/core/params/polar-params";
import {
  OverriddenTaskDefinition,
  SimpleTaskDefinition
} from "../../../src/internal/core/tasks/task-definitions";
import {
  RuntimeArgs,
  TaskArguments,
  TaskDefinition
} from "../../../src/types";
import { expectPolarError } from "../../helpers/errors";

const SHOW_STACK = "--show-stack-traces";

function parseAndexpectPolarError (
  argumentsParser: ArgumentsParser,
  envArgs: RuntimeArgs,
  rawCLAs: string[],
  errorDescriptor: ErrorDescriptor): void {
    expectPolarError(
    () =>
      argumentsParser.parseRuntimeArgs(
        POLAR_PARAM_DEFINITIONS,
        POLAR_SHORT_PARAM_SUBSTITUTIONS,
        envArgs,
        rawCLAs
      ),
    errorDescriptor
  );
}

describe("ArgumentsParser", () => {
  let argumentsParser: ArgumentsParser;
  let envArgs: RuntimeArgs;
  let taskDefinition: TaskDefinition;
  let overridenTaskDefinition: OverriddenTaskDefinition;

  beforeEach(() => {
    argumentsParser = new ArgumentsParser();
    envArgs = {
      network: "test",
      showStackTraces: false,
      version: false,
      help: false,
      verbose: false
    };
    taskDefinition = new SimpleTaskDefinition("compile", true)
      .addParam("param", "just a param", "a default value", string)
      .addParam("bleep", "useless param", 1602, int, true);

    const baseTaskDefinition = new SimpleTaskDefinition("overriddenTask")
      .addParam("strParam", "a str param", "defaultValue", string)
      .addFlag("aFlag", "a flag param");

    overridenTaskDefinition = new OverriddenTaskDefinition(baseTaskDefinition)
      .addFlag("overriddenFlag", "added flag param")
      .addOptionalParam("overriddenOptParam", "added opt param");
  });

  it("should transform a param name into CLA", () => {
    assert.equal(
      ArgumentsParser.paramNameToCLA("showStackTraces"),
      SHOW_STACK
    );
    assert.equal(ArgumentsParser.paramNameToCLA("version"), "--version");
  });

  it("Should throw if a param name CLA isn't all lowercase", () => {
    expectPolarError(
      () => ArgumentsParser.cLAToParamName("--show-Stack-traces"),
      ERRORS.ARGUMENTS.PARAM_NAME_INVALID_CASING
    );

    expectPolarError(
      () => ArgumentsParser.cLAToParamName("--shOw-stack-traces"),
      ERRORS.ARGUMENTS.PARAM_NAME_INVALID_CASING
    );

    expectPolarError(
      () => ArgumentsParser.cLAToParamName("--show-stack-tRaces"),
      ERRORS.ARGUMENTS.PARAM_NAME_INVALID_CASING
    );
  });

  it("should transform CLA into a param name", () => {
    assert.equal(ArgumentsParser.cLAToParamName("--run"), "run");

    assert.equal(
      ArgumentsParser.cLAToParamName(SHOW_STACK),
      "showStackTraces"
    );
  });

  it("should detect param name format", () => {
    assert.isTrue(argumentsParser._hasCLAParamNameFormat("--run"));
    assert.isFalse(argumentsParser._hasCLAParamNameFormat("run"));
  });

  it("should detect parameter names", () => {
    assert.isTrue(
      argumentsParser._isCLAParamName(
        "--show-stack-traces",
        POLAR_PARAM_DEFINITIONS
      )
    );
    assert.isFalse(
      argumentsParser._isCLAParamName("sarasa", POLAR_PARAM_DEFINITIONS)
    );
    assert.isFalse(
      argumentsParser._isCLAParamName("--sarasa", POLAR_PARAM_DEFINITIONS)
    );
  });

  describe("polar arguments", () => {
    it("should parse polar arguments with task", () => {
      const rawCLAs: string[] = [
        SHOW_STACK,
        "--network",
        "local",
        "compile",
        "--task-param"
      ];

      const {
        runtimeArgs,
        taskName,
        unparsedCLAs
      } = argumentsParser.parseRuntimeArgs(
        POLAR_PARAM_DEFINITIONS,
        POLAR_SHORT_PARAM_SUBSTITUTIONS,
        envArgs,
        rawCLAs
      );
      assert.equal(taskName, "compile");
      assert.equal(runtimeArgs.showStackTraces, true);
      assert.equal(runtimeArgs.network, "local");
      assert.equal(unparsedCLAs.length, 1);
      assert.equal("--task-param", unparsedCLAs[0]);
    });

    it("should parse polar arguments after taskname", () => {
      const rawCLAs: string[] = [
        "compile",
        "--task-param",
        "--show-stack-traces",
        "--network",
        "local"
      ];

      const {
        runtimeArgs,
        taskName,
        unparsedCLAs
      } = argumentsParser.parseRuntimeArgs(
        POLAR_PARAM_DEFINITIONS,
        POLAR_SHORT_PARAM_SUBSTITUTIONS,
        envArgs,
        rawCLAs
      );
      assert.equal(taskName, "compile");
      assert.equal(runtimeArgs.showStackTraces, true);
      assert.equal(runtimeArgs.network, "local");
      assert.equal(unparsedCLAs.length, 1);
      assert.equal("--task-param", unparsedCLAs[0]);
    });

    it("should fail trying to parse task arguments before taskname", () => {
      const rawCLAs: string[] = [
        "--task-param",
        "compile",
        "--show-stack-traces",
        "--network",
        "local"
      ];
      parseAndexpectPolarError(
        argumentsParser,
        envArgs,
        rawCLAs,
        ERRORS.ARGUMENTS.UNRECOGNIZED_COMMAND_LINE_ARG);
    });

    it("should parse a polar argument", () => {
      const rawCLAs: string[] = [
        "--show-stack-traces",
        "--network",
        "local",
        "compile"
      ];

      const runtimeArgs: TaskArguments = {};
      assert.equal(
        0,
        argumentsParser._parseArgumentAt(
          rawCLAs,
          0,
          POLAR_PARAM_DEFINITIONS,
          runtimeArgs
        )
      );
      assert.equal(runtimeArgs.showStackTraces, true);
      assert.equal(
        2,
        argumentsParser._parseArgumentAt(
          rawCLAs,
          1,
          POLAR_PARAM_DEFINITIONS,
          runtimeArgs
        )
      );
      assert.equal(runtimeArgs.network, "local");
    });

    it("should fail trying to parse polar with invalid argument", () => {
      const rawCLAs: string[] = [
        SHOW_STACK,
        "--network",
        "local",
        "--invalid-param"
      ];
      parseAndexpectPolarError(
        argumentsParser,
        envArgs,
        rawCLAs,
        ERRORS.ARGUMENTS.UNRECOGNIZED_COMMAND_LINE_ARG);
    });

    it("should fail trying to parse a repeated argument", () => {
      const rawCLAs: string[] = [
        SHOW_STACK,
        "--network",
        "local",
        "--network",
        "local",
        "compile"
      ];
      parseAndexpectPolarError(
        argumentsParser,
        envArgs,
        rawCLAs,
        ERRORS.ARGUMENTS.REPEATED_PARAM);
    });

    it("should only add non-present arguments", () => {
      const runtimeArgs = argumentsParser._addBuilderDefaultArguments(
        POLAR_PARAM_DEFINITIONS,
        envArgs,
        {
          showStackTraces: true
        }
      );

      assert.isTrue(runtimeArgs.showStackTraces);
    });

    it("should not change network unless specified by user", () => {
      const rawCLAs: string[] = [
        SHOW_STACK,
        "compile",
        "--task-param"
      ];

      const {
        runtimeArgs,
        taskName,
        unparsedCLAs
      } = argumentsParser.parseRuntimeArgs(
        POLAR_PARAM_DEFINITIONS,
        POLAR_SHORT_PARAM_SUBSTITUTIONS,
        envArgs,
        rawCLAs
      );
      assert.equal(taskName, "compile");
      assert.equal(runtimeArgs.showStackTraces, true);
      assert.equal(runtimeArgs.network, "test");
      assert.equal(unparsedCLAs.length, 1);
      assert.equal("--task-param", unparsedCLAs[0]);
    });
  });

  describe("tasks arguments", () => {
    it("should parse tasks arguments", () => {
      const rawCLAs: string[] = ["--param", "testing", "--bleep", "1337"];
      const { paramArguments, rawPositionalArguments } =
        argumentsParser._parseTaskParamArguments(taskDefinition, rawCLAs);
      assert.deepEqual(paramArguments, { param: "testing", bleep: 1337 });
      assert.equal(rawPositionalArguments.length, 0);
    });

    it("should parse overridden tasks arguments", () => {
      const rawCLAs: string[] = [
        "--str-param",
        "testing",
        "--a-flag",
        "--overridden-flag",
        "--overridden-opt-param",
        "optValue"
      ];

      const { paramArguments, rawPositionalArguments } =
        argumentsParser._parseTaskParamArguments(overridenTaskDefinition, rawCLAs);
      assert.deepEqual(paramArguments, {
        strParam: "testing",
        aFlag: true,
        overriddenFlag: true,
        overriddenOptParam: "optValue"
      });
      assert.equal(rawPositionalArguments.length, 0);
    });

    it("should parse task with variadic arguments", () => {
      taskDefinition.addVariadicPositionalParam(
        "variadic",
        "a variadic params",
        [],
        int
      );

      const rawPositionalArguments = ["16", "02"];
      const positionalArguments = argumentsParser._parsePositionalParamArgs(
        rawPositionalArguments,
        taskDefinition.positionalParamDefinitions
      );
      assert.deepEqual(positionalArguments.variadic, [16, 2]);
    });

    it("should parse task with default variadic arguments", () => {
      taskDefinition.addVariadicPositionalParam(
        "variadic",
        "a variadic params",
        [1729],
        int
      );

      const rawPositionalArguments: string[] = [];
      // tslint:disable-next-line:no-string-literal
      const positionalArguments = argumentsParser._parsePositionalParamArgs(
        rawPositionalArguments,
        taskDefinition.positionalParamDefinitions
      );

      assert.deepEqual(positionalArguments.variadic, [1729]);
    });

    it("should fail when passing invalid parameter", () => {
      expectPolarError(() => {
        argumentsParser.parseTaskArguments(
          taskDefinition,
          ["--invalid-parameter", "not_valid"]);
      }, ERRORS.ARGUMENTS.UNRECOGNIZED_PARAM_NAME);
    });

    it("should fail to parse task without non optional variadic arguments", () => {
      taskDefinition.addVariadicPositionalParam(
        "variadic",
        "a variadic params"
      );

      expectPolarError(() => {
        argumentsParser.parseTaskArguments(
          taskDefinition,
          ["--param", "testing", "--bleep", "1337"]);
      }, ERRORS.ARGUMENTS.MISSING_POSITIONAL_ARG);
    });

    it("should fail to parse task without non optional argument", () => {
      const definition = new SimpleTaskDefinition("compile", true);
      definition.addParam("param", "just a param");
      definition.addParam("bleep", "useless param", 1602, int, true);
      expectPolarError(() => {
        argumentsParser.parseTaskArguments(definition, []);
      }, ERRORS.ARGUMENTS.MISSING_TASK_ARGUMENT);
    });

    it("should fail when passing unneeded arguments", () => {
      expectPolarError(() => {
        argumentsParser.parseTaskArguments(taskDefinition, ["more", "arguments"]);
      }, ERRORS.ARGUMENTS.UNRECOGNIZED_POSITIONAL_ARG);
    });

    it("should parse task with positional arguments", () => {
      const rawCLAs: string[] = [
        "--param",
        "testing",
        "--bleep",
        "1337",
        "foobar"
      ];
      taskDefinition.addPositionalParam("positional", "a posititon param");

      const args = argumentsParser.parseTaskArguments(taskDefinition, rawCLAs);
      assert.deepEqual(args, {
        param: "testing",
        bleep: 1337,
        positional: "foobar"
      });
    });

    it("Should throw the right error if the last CLA is a non-flag --param", () => {
      const rawCLAs: string[] = ["--b"];

      taskDefinition = new SimpleTaskDefinition("t", false)
        .addOptionalParam("b", "A boolean", true, boolean)
        .setAction(async () => {});

      expectPolarError(
        () => argumentsParser.parseTaskArguments(taskDefinition, rawCLAs),
        ERRORS.ARGUMENTS.MISSING_TASK_ARGUMENT
      );
    });
  });
});
