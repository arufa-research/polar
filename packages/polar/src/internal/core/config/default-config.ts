import type { Config, PolarNetworkUserConfig } from "../../../types";
const SCRT_CHAIN_NAME = "testnet";

const cfg: PolarNetworkUserConfig = {
  accounts: [],
  url: SCRT_CHAIN_NAME,
  chainId: 'columbus-3'
};

const defaultConfig: Config = {
  networks: {
    [SCRT_CHAIN_NAME]: cfg
  },
  mocha: {
    timeout: 20000
  }
};

export default defaultConfig;
