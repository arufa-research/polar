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
// Networks config

export type PolarNetworkAccountsUserConfig = string[];

export interface PolarNetworkUserConfig {
  endpoint?: string
  httpHeaders?: Record<string, string>
  accounts?: PolarNetworkAccountsUserConfig
  gasLimit?: string | number
}

export interface NetworksUserConfig {
  [networkName: string]: NetworkUserConfig | undefined
}

export type NetworkUserConfig = PolarNetworkUserConfig;

export type PolarNetworkConfig = PolarNetworkUserConfig;

export type NetworkConfig = PolarNetworkConfig;

export interface NetworksConfig {
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
}

// Polar config

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
  networks: NetworksConfig
  mocha: Mocha.MochaOptions
  docker: DockerConfig
}

// Plugins config functionality

export type ConfigExtender = (
  config: PolarConfig,
  userConfig: Readonly<PolarUserConfig>
) => void;
