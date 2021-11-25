import { info } from "console";
import { CosmWasmClient, EnigmaUtils, ExecuteResult, FeeTable, Secp256k1Pen, SigningCosmWasmClient } from "secretjs";

import { Account, Network } from "../types";

export function getClient (network: Network): CosmWasmClient {
  // info(`Creating client for network: ${network.name}`);  no need to log this
  return new CosmWasmClient(
    network.config.endpoint, network.config.seed, network.config.broadCastMode
  );
}

export async function getSigningClient (
  network: Network,
  account: Account,
  customFees?: Partial<FeeTable> | undefined
): Promise<SigningCosmWasmClient> {
  // info(`Creating signing client for network: ${network.name}`);  no need to log this
  const signingPen = await Secp256k1Pen.fromMnemonic(account.mnemonic);
  const txEncryptionSeed = EnigmaUtils.GenerateNewSeed();
  return new SigningCosmWasmClient(
    network.config.endpoint,
    account.address,
    (signBytes) => signingPen.sign(signBytes),
    network.config.seed ?? txEncryptionSeed,
    customFees,
    network.config.broadCastMode
  );
}

export { ExecuteResult };
