import { Coin, LCDClient } from '@terra-money/terra.js';
import { info } from "console";

import { Network } from "../types";

export function getClient (network: Network): LCDClient {
  info(`Creating client for network: ${network.name}`);
  // connect to localterra
  return new LCDClient({
    URL: network.config.url,
    chainID: network.config.chainId,
    gasPrices: [new Coin('uluna', '0.15')],
    gasAdjustment: '1.5'
  });
}
