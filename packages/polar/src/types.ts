/* eslint-disable no-use-before-define */
// This file defines the different config types.
//
// For each possible kind of config value, we have two type:
//
// One that ends with UserConfig, which represent the config as
// written in the user's config file.
//
// The other one, with the same name except without the User part, represents
// the resolved value as used during the polar execution.
//
// Note that while many declarations are repeated here (i.e. network types'
// fields), we don't use `extends` as that can interfere with plugin authors
// trying to augment the config types.
// Networks config\
import { FeePool } from "secretjs/dist/protobuf_stuff/cosmos/distribution/v1beta1/distribution";

import * as types from "./internal/core/params/argument-types";

export interface Account {
  name: string
  address: string
  mnemonic: string
}
export interface Coin {
  readonly denom: string
  readonly amount: string
}
export interface StdFee {
  readonly amount: readonly Coin[]
  readonly gas: string
}

export interface UserAccount {
  account: Account
  getBalance: () => Promise<readonly Coin[]>
}

export interface ContractInfo {
  codeId: number
  contractCodeHash: string
  deployTimestamp: string
}

export interface Checkpoints {
  [network: string]: CheckpointInfo
}

export interface CheckpointInfo {
  deployInfo?: DeployInfo
  instantiateInfo?: InstantiateInfo
  metadata?: Map<string, string>
}

export interface InstantiateInfo {
  contractAddress: string
  instantiateTimestamp: string
}

export interface DeployInfo {
  codeId: number
  contractCodeHash: string
  deployTimestamp: string
}

export type PolarNetworkAccountsUserConfig = Account[];

export interface PolarNetworkUserConfig {
  endpoint: string
  accounts: PolarNetworkAccountsUserConfig
  gasLimit?: string | number
  chainId: string
  // TODO: check fees
  fees?: Partial<FeePool>
}

export interface NetworksUserConfig {
  [networkName: string]: NetworkUserConfig | undefined
}

export type NetworkUserConfig = PolarNetworkUserConfig;

export type PolarNetworkConfig = PolarNetworkUserConfig;

export type NetworkConfig = PolarNetworkConfig;

export interface Networks {
  [networkName: string]: PolarNetworkConfig
}

export type PolarNetworkAccountsConfig =
  | PolarNetworkHDAccountsConfig
  | PolarNetworkAccountConfig[];

export interface PolarNetworkAccountConfig {
  privateKey: string
  balance: string
}

export interface PolarNetworkHDAccountsConfig {
  mnemonic: string
  initialIndex: number
  count: number
  path: string
  accountsBalance: string
}

export interface PolarNetworkForkingConfig {
  enabled: boolean
  url: string
  blockNumber?: number
}

export interface HttpNetworkConfig {
  chainId?: number
  from?: string
  gas: 'auto' | number
  gasPrice: 'auto' | number
  gasMultiplier: number
  url: string
  timeout: number
  httpHeaders: { [name: string]: string }
  accounts: HttpNetworkAccountsConfig
}

export type HttpNetworkAccountsConfig =
  | 'remote'
  | string[]
  | HttpNetworkHDAccountsConfig;

export interface HttpNetworkHDAccountsConfig {
  mnemonic: string
  initialIndex: number
  count: number
  path: string
}

export interface DockerConfig {
  sudo: boolean
  runTestnet?: string
}

// Project paths config

export interface ProjectPathsUserConfig {
  root?: string
  cache?: string
  artifacts?: string
  tests?: string
}

export interface ProjectPathsConfig {
  root: string
  configFile: string
  cache: string
  artifacts: string
  tests: string
  sources: string
}

// Polar config
export type UserPaths = Omit<Partial<ProjectPathsConfig>, "configFile">;

export interface Config {
  networks?: Networks
  paths?: UserPaths
  mocha?: Mocha.MochaOptions
}

export interface PolarUserConfig {
  defaultNetwork?: string
  paths?: ProjectPathsUserConfig
  networks?: NetworksUserConfig
  mocha?: Mocha.MochaOptions
  docker?: DockerConfig
}

export interface PolarConfig {
  defaultNetwork: string
  paths: ProjectPathsConfig
  networks: Networks
  mocha: Mocha.MochaOptions
  docker: DockerConfig
}

// Plugins config functionality

export type ConfigExtender = (
  config: ResolvedConfig,
  userConfig: Readonly<PolarUserConfig>
) => void;

/**
 * A function that receives a RuntimeEnv and
 * modify its properties or add new ones.
 */
export type EnvironmentExtender = (env: PolarRuntimeEnvironment) => void;

/**
 * @type TaskArguments {object-like} - the input arguments for a task.
 *
 * TaskArguments type is set to 'any' because it's interface is dynamic.
 * It's impossible in TypeScript to statically specify a variadic
 * number of fields and at the same time define specific types for\
 * the argument values.
 *
 * For example, we could define:
 * type TaskArguments = Record<string, any>;
 *
 * ...but then, we couldn't narrow the actual argument value's type in compile time,
 * thus we have no other option than forcing it to be just 'any'.
 */
export type TaskArguments = any; // eslint-disable-line @typescript-eslint/no-explicit-any

export type RunTaskFunction = (
  name: string,
  taskArguments?: TaskArguments
) => PromiseAny;

export interface RunSuperFunction<ArgT extends TaskArguments> {
  (taskArguments?: ArgT): PromiseAny
  isDefined: boolean
}

export type ActionType<ArgsT extends TaskArguments> = (
  taskArgs: ArgsT,
  env: PolarRuntimeEnvironment,
  runSuper: RunSuperFunction<ArgsT>
) => PromiseAny;

export interface Network {
  name: string
  config: NetworkConfig
  // provider:
}

interface RustVersion {
  version: string
}

export interface ResolvedConfig extends PolarUserConfig {
  paths?: ProjectPathsConfig
  rust?: RustVersion
  networks: Networks
}

/**
 * Polar arguments:
 * + network: the network to be used (default="default").
 * + showStackTraces: flag to show stack traces.
 * + version: flag to show polar's version.
 * + help: flag to show polar's help message.
 * + config: used to specify polar's config file.
 */
export interface RuntimeArgs {
  network: string
  command?: string
  useCheckpoints?: boolean
  showStackTraces: boolean
  version: boolean
  help: boolean
  config?: string
  verbose: boolean
}

export interface ConfigurableTaskDefinition {
  setDescription: (description: string) => this

  setAction: (action: ActionType<TaskArguments>) => this

  addParam: <T>(
    name: string,
    description?: string,
    defaultValue?: T,
    type?: types.ArgumentType<T>,
    isOptional?: boolean
  ) => this

  addOptionalParam: <T>(
    name: string,
    description?: string,
    defaultValue?: T,
    type?: types.ArgumentType<T>
  ) => this

  addPositionalParam: <T>(
    name: string,
    description?: string,
    defaultValue?: T,
    type?: types.ArgumentType<T>,
    isOptional?: boolean
  ) => this

  addOptionalPositionalParam: <T>(
    name: string,
    description?: string,
    defaultValue?: T,
    type?: types.ArgumentType<T>
  ) => this

  addVariadicPositionalParam: <T>(
    name: string,
    description?: string,
    defaultValue?: T[],
    type?: types.ArgumentType<T>,
    isOptional?: boolean
  ) => this

  addOptionalVariadicPositionalParam: <T>(
    name: string,
    description?: string,
    defaultValue?: T[],
    type?: types.ArgumentType<T>
  ) => this

  addFlag: (name: string, description?: string) => this
}

export interface ParamDefinition<T> {
  name: string
  shortName?: string
  defaultValue?: T
  type: types.ArgumentType<T>
  description?: string
  isOptional: boolean
  isFlag: boolean
  isVariadic: boolean
}

export type ParamDefinitionAny = ParamDefinition<any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export interface OptionalParamDefinition<T> extends ParamDefinition<T> {
  defaultValue: T
  isOptional: true
}

export interface ParamDefinitionsMap {
  [paramName: string]: ParamDefinitionAny
}

export type ParamDefinitions = {
  [param in keyof Required<RuntimeArgs>]: OptionalParamDefinition<
  RuntimeArgs[param]
  >;
};

export interface ShortParamSubstitutions {
  [name: string]: string
}

export interface TaskDefinition extends ConfigurableTaskDefinition {
  readonly name: string
  readonly description?: string
  readonly action: ActionType<TaskArguments>
  readonly isInternal: boolean

  // TODO: Rename this to something better. It doesn't include the positional
  // params, and that's not clear.
  readonly paramDefinitions: ParamDefinitionsMap

  readonly positionalParamDefinitions: ParamDefinitionAny[]
}

export interface TasksMap {
  [name: string]: TaskDefinition
}

export interface PolarRuntimeEnvironment {
  readonly config: ResolvedConfig
  readonly runtimeArgs: RuntimeArgs
  readonly tasks: TasksMap
  readonly run: RunTaskFunction
  readonly network: Network
}
// eslint-disable-next-line
export type PromiseAny = Promise<any>;

export interface StrMap {
  [key: string]: string
}

// schema related types

export type AnyJson =
  string | number | boolean | null | undefined | AnyJson[] | { [index: string]: AnyJson };

export type AnyFunction = (...args: any[]) => any; // eslint-disable-line  @typescript-eslint/no-explicit-any

export type AnyNumber = bigint | Uint8Array | number | string; // later add BN if big number is req

export type AnyString = string | string;

export type AnyU8a = Uint8Array | number[] | string;

export type ContractFunction<T = any> = ( // eslint-disable-line  @typescript-eslint/no-explicit-any
  ...args: any[] // eslint-disable-line  @typescript-eslint/no-explicit-any
) => Promise<T>;
