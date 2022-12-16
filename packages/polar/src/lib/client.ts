import { SecretNetworkClient, Wallet } from "secretjs";

import { Account, Network } from "../types";

export function getClient (network: Network): SecretNetworkClient {
  return new SecretNetworkClient({
    chainId: network.config.chainId,
    url: network.config.endpoint
  });
}

export function getSigningClient (
  network: Network,
  account: Account
): SecretNetworkClient {
  const wall = new Wallet(account.mnemonic);
  return new SecretNetworkClient({
    url: network.config.endpoint,
    chainId: network.config.chainId,
    wallet: wall,
    walletAddress: account.address
  });
}
