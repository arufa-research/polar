import { info } from "console";
import { CosmWasmClient, SigningCosmWasmClient } from "secretjs";

import { Account, Network } from "../types";

export function getClient (network: Network): CosmWasmClient {
  info(`Creating client for network: ${network.name}`);
  return new CosmWasmClient(
    network.config.endpoint, network.config.seed, network.config.broadCastMode
  );
}

export function getSigningClient (network: Network, account: Account): SigningCosmWasmClient {
  info(`Creating client for network: ${network.name}`);
  return new SigningCosmWasmClient(
    network.config.endpoint,
    account.address,
    (signBytes) => account.signingPen.sign(signBytes),
    network.config.seed,
    undefined,
    network.config.broadCastMode
  );
}
