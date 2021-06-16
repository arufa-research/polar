import {
  ActionType,
  ConfigExtender,
  ConfigurableTaskDefinition,
  EnvironmentExtender,
  TaskArguments
} from "../../../types";
import { PolarContext } from "../../context";
import * as argumentTypes from "../params/argument-types";
import { usePlugin as usePluginImplementation } from "../plugins";

export function task<ArgsT extends TaskArguments> (
  name: string,
  description?: string,
  action?: ActionType<ArgsT>
): ConfigurableTaskDefinition;

export function task<ArgsT extends TaskArguments> (
  name: string,
  action: ActionType<ArgsT>
): ConfigurableTaskDefinition;

export function task<ArgsT extends TaskArguments> (
  name: string,
  descriptionOrAction?: string | ActionType<ArgsT>,
  action?: ActionType<ArgsT>
): ConfigurableTaskDefinition {
  const ctx = PolarContext.getPolarContext();
  const dsl = ctx.tasksDSL;

  if (descriptionOrAction === undefined) {
    return dsl.task(name);
  }

  if (typeof descriptionOrAction !== "string") {
    return dsl.task(name, descriptionOrAction);
  }

  return dsl.task(name, descriptionOrAction, action);
}

export function internalTask<ArgsT extends TaskArguments> (
  name: string,
  description?: string,
  action?: ActionType<ArgsT>
): ConfigurableTaskDefinition;

export function internalTask<ArgsT extends TaskArguments> (
  name: string,
  action: ActionType<ArgsT>
): ConfigurableTaskDefinition;

export function internalTask<ArgsT extends TaskArguments> (
  name: string,
  descriptionOrAction?: string | ActionType<ArgsT>,
  action?: ActionType<ArgsT>
): ConfigurableTaskDefinition {
  const ctx = PolarContext.getPolarContext();
  const dsl = ctx.tasksDSL;

  if (descriptionOrAction === undefined) {
    return dsl.internalTask(name);
  }

  if (typeof descriptionOrAction !== "string") {
    return dsl.internalTask(name, descriptionOrAction);
  }

  return dsl.internalTask(name, descriptionOrAction, action);
}

export const types = argumentTypes;

/**
 * Register an environment extender what will be run after the
 * polar Runtime Environment is initialized.
 *
 * @param extender A function that receives the polar Runtime
 * Environment.
 */
export function extendEnvironment (extender: EnvironmentExtender): void {
  const ctx = PolarContext.getPolarContext();
  const extenderManager = ctx.extendersManager;
  extenderManager.add(extender);
}

export function extendConfig (extender: ConfigExtender): void {
  const ctx = PolarContext.getPolarContext();
  ctx.configExtenders.push(extender);
}

/**
 * Loads a polar plugin
 * @param pluginName The plugin name.
 */
export function usePlugin (pluginName: string): void {
  const ctx = PolarContext.getPolarContext();
  usePluginImplementation(ctx, pluginName);
}
