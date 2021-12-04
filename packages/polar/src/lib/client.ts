import { CosmWasmClient, EnigmaUtils, ExecuteResult, Secp256k1Pen, SigningCosmWasmClient } from "secretjs";

import { Account, Network } from "../types";

export function getClient (network: Network): CosmWasmClient {
  return new CosmWasmClient(
    network.config.endpoint, network.config.seed, network.config.broadCastMode
  );
}

export async function getSigningClient (
  network: Network,
  account: Account
): Promise<SigningCosmWasmClient> {
  const signingPen = await Secp256k1Pen.fromMnemonic(account.mnemonic);
  const txEncryptionSeed = EnigmaUtils.GenerateNewSeed();
  return new SigningCosmWasmClient(
    network.config.endpoint,
    account.address,
    (signBytes) => signingPen.sign(signBytes),
    network.config.seed ?? txEncryptionSeed,
    network.config.fees,
    network.config.broadCastMode
  );
}

export { ExecuteResult };
