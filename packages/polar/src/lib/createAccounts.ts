import {
  MnemonicKey
} from "@terra-money/terra.js";

import { Account } from "../types";

export async function createAccounts (n: number): Promise<Account[]> {
  const accounts: Account[] = [];
  for (let i = 0; i < n; ++i) {
    // Create random address and mnemonic
    const mnemonic = new MnemonicKey();

    accounts.push({
      name: "account_" + i.toString(),
      address: mnemonic.accAddress,
      mnemonic: mnemonic.mnemonic
    });
  }
  return accounts;
}
