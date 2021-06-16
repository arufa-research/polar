import type { Config, PolarNetworkUserConfig } from "../../../types";
const SCRT_CHAIN_NAME = "testnet";

const cfg: PolarNetworkUserConfig = {
  accounts: [],
  endpoint: SCRT_CHAIN_NAME
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
