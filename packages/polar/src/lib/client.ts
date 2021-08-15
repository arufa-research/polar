import { info } from "console";
import { CosmWasmClient } from "secretjs";

import { Network } from "../types";

export function getClient (network: Network): CosmWasmClient {
  info(`Creating client for network: ${network.name}`);
  return new CosmWasmClient(
    network.config.endpoint, network.config.seed, network.config.broadCastMode
  );
}
