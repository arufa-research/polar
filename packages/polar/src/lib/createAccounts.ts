import {
  Wallet
} from "secretjs";

import { Account } from "../types";

export async function createAccounts (n: number): Promise<Account[]> {
  const accounts: Account[] = [];
  for (let i = 0; i < n; ++i) {
    // Create random address and mnemonic
    const wallet = new Wallet();
    accounts.push({
      name: "account_" + i.toString(),
      address: wallet.address,
      mnemonic: wallet.mnemonic
    });
  }
  return accounts;
}
