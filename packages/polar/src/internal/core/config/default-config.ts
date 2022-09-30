import type { Config, PolarNetworkUserConfig } from "../../../types";
const SCRT_CHAIN_NAME = "testnet";

const cfg: PolarNetworkUserConfig = {
  accounts: [],
  endpoint: SCRT_CHAIN_NAME,
  chainId: "pulsar-3"
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
