import { SecretNetworkClient, Wallet } from "secretjs";

import { Account, Network } from "../types";

export async function getClient (network: Network): Promise<SecretNetworkClient> {
  return new SecretNetworkClient({
    chainId: network.config.chainId,
    url: network.config.endpoint
  });
}

export async function getSigningClient (
  network: Network,
  account: Account
): Promise<SecretNetworkClient> {
  const wall = new Wallet(account.mnemonic);
  return new SecretNetworkClient({
    url: network.config.endpoint,
    chainId: network.config.chainId,
    wallet: wall,
    walletAddress: account.address
  });
}
