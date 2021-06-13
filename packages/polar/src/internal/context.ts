import { ConfigExtender, PolarRuntimeEnvironment } from '../types';
import { ExtenderManager } from './core/config/extenders';
import { PolarError } from './core/errors';
import { ERRORS } from './core/errors-list';
import { TasksDSL } from './core/tasks/dsl';

export type GlobalWithPolarContext = NodeJS.Global & {
  // eslint-disable-next-line no-use-before-define
  __polarContext: PolarContext
};

export class PolarContext {
  public static isCreated (): boolean {
    const globalWithPolarContext = global as unknown as GlobalWithPolarContext;

    return globalWithPolarContext.__polarContext !== undefined;
  }

  public static createPolarContext (): PolarContext {
    if (this.isCreated()) {
      throw new PolarError(ERRORS.GENERAL.CONTEXT_ALREADY_CREATED);
    }

    const globalWithPolarContext = global as unknown as GlobalWithPolarContext;
    const ctx = new PolarContext();

    globalWithPolarContext.__polarContext = ctx;

    return ctx;
  }

  public static getPolarContext (): PolarContext {
    const globalWithPolarContext = global as unknown as GlobalWithPolarContext;
    const ctx = globalWithPolarContext.__polarContext;

    if (ctx === undefined) {
      throw new PolarError(ERRORS.GENERAL.CONTEXT_NOT_CREATED);
    }

    return ctx;
  }

  public static deletePolarContext (): void {
    const globalAsAny = global as any;

    globalAsAny.__PolarContext = undefined;
  }

  public readonly tasksDSL = new TasksDSL();
  public readonly extendersManager = new ExtenderManager();
  public readonly loadedPlugins: string[] = [];
  public environment?: PolarRuntimeEnvironment;
  public readonly configExtenders: ConfigExtender[] = [];

  public setRuntimeEnv (env: PolarRuntimeEnvironment): void {
    if (this.environment !== undefined) {
      throw new PolarError(ERRORS.GENERAL.CONTEXT_PRE_ALREADY_DEFINED);
    }
    this.environment = env;
  }

  public getRuntimeEnv (): PolarRuntimeEnvironment {
    if (this.environment === undefined) {
      throw new PolarError(ERRORS.GENERAL.CONTEXT_PRE_NOT_DEFINED);
    }
    return this.environment;
  }

  public setPluginAsLoaded (pluginName: string): void {
    this.loadedPlugins.push(pluginName);
  }
}
