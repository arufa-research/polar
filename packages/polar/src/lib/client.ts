import { SecretNetworkClient, Wallet } from "secretjs";

import { Account, Network } from "../types";

export async function getClient (network: Network): Promise<SecretNetworkClient> {
  return await SecretNetworkClient.create({
    chainId: network.config.chainId,
    grpcWebUrl: network.config.endpoint
  });
}

export async function getSigningClient (
  network: Network,
  account: Account
): Promise<SecretNetworkClient> {
  const wall = new Wallet(account.mnemonic);
  return await SecretNetworkClient.create({
    grpcWebUrl: network.config.endpoint,
    chainId: network.config.chainId,
    wallet: wall,
    walletAddress: account.address
  });
}
