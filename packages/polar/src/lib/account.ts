import { Account as WasmAccount, SecretNetworkClient } from "secretjs";

import { PolarContext } from "../internal/context";
import { PolarError } from "../internal/core/errors";
import { ERRORS } from "../internal/core/errors-list";
import { Account, Coin, PolarRuntimeEnvironment, UserAccount } from "../types";
import { getClient } from "./client";

export class UserAccountI implements UserAccount {
  account: Account;
  client?: SecretNetworkClient;

  constructor (account: Account) {
    this.account = account;
  }

  async loadClient (env: PolarRuntimeEnvironment): Promise<void> {
    this.client = await getClient(env.network);
  }

  async getAccountInfo (): Promise<WasmAccount | undefined> {
    if (this.client === undefined) {
      throw new Error("Client is not loaded, Please load client using `await loadClient(env)`");
    }
    return await this.client.query.auth.account({ address: this.account.address });
  }

  async getBalance (): Promise<readonly Coin[]> {
    if (this.client === undefined) {
      throw new Error("Client is not loaded, Please load client using `await loadClient(env)`");
    }
    const info = await this.client.query.bank.balance({
      address: this.account.address,
      denom: "uscrt"
    });
    if (info === undefined) {
      throw new PolarError(ERRORS.GENERAL.BALANCE_UNDEFINED);
    }
    return [info.balance ?? { amount: "0", denom: "uscrt" }];
  }
}

export async function getAccountByName (
  name: string
): Promise<Account | UserAccount> {
  const env: PolarRuntimeEnvironment = PolarContext.getPolarContext().getRuntimeEnv();
  if (env.network.config.accounts === undefined) {
    throw new PolarError(ERRORS.GENERAL.ACCOUNT_DOES_NOT_EXIST, { name: name });
  }
  for (const value of env.network.config.accounts) {
    if (value.name === name) {
      const res = new UserAccountI(value);
      await res.loadClient(env);
      return res;
    }
  }
  throw new PolarError(ERRORS.GENERAL.ACCOUNT_DOES_NOT_EXIST, { name: name });
}
