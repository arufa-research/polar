import { Bip39, Random } from "@iov/crypto";
import {
  encodeSecp256k1Pubkey,
  pubkeyToAddress, Secp256k1Pen
} from "secretjs";

import { Account } from "../types";

export async function createAccounts (n: number): Promise<Account[]> {
  const accounts: Account[] = [];
  for (let i = 0; i < n; ++i) {
    // Create random address and mnemonic
    const mnemonic = Bip39.encode(Random.getBytes(16)).toString();

    // This wraps a single keypair and allows for signing.
    const signingPen = await Secp256k1Pen.fromMnemonic(mnemonic);

    // Get the public key
    const pubkey = encodeSecp256k1Pubkey(signingPen.pubkey);

    // Get the wallet address
    const accAddress = pubkeyToAddress(pubkey, 'secret');

    accounts.push({
      name: "account_" + i.toString(),
      address: accAddress,
      mnemonic: mnemonic
    });
  }
  return accounts;
}
