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

  async setupClient (env: PolarRuntimeEnvironment): Promise<void> {
    this.client = getClient(env.network);
  }

  async getAccountInfo (): Promise<WasmAccount | undefined> {
    if (this.client === undefined) {
      throw new PolarError(ERRORS.GENERAL.CLIENT_NOT_LOADED);
    }
    return (await this.client.query.auth.account({ address: this.account.address })).account;
  }

  async getBalance (): Promise<Coin[]> {
    if (this.client === undefined) {
      throw new PolarError(ERRORS.GENERAL.CLIENT_NOT_LOADED);
    }
    const info = await this.client.query.bank.balance({
      address: this.account.address,
      denom: "uscrt"
    });
    if (info === undefined) {
      throw new PolarError(ERRORS.GENERAL.BALANCE_UNDEFINED);
    }

    const infoBalance = info.balance ?? { amount: "0", denom: "uscrt" };
    const normalisedBalance: Coin = (infoBalance.amount === undefined ||
      infoBalance.denom === undefined) ? { amount: "0", denom: "uscrt" }
      : { amount: infoBalance.amount, denom: infoBalance.denom };
    return [normalisedBalance];
  }
}

export async function getAccountByName (
  name: string
): Promise<UserAccount> {
  const env: PolarRuntimeEnvironment = PolarContext.getPolarContext().getRuntimeEnv();
  if (env.network.config.accounts === undefined) {
    throw new PolarError(ERRORS.GENERAL.ACCOUNT_DOES_NOT_EXIST, { name: name });
  }
  for (const value of env.network.config.accounts) {
    if (value.name === name) {
      const res = new UserAccountI(value);
      await res.setupClient(env);
      return res;
    }
  }
  throw new PolarError(ERRORS.GENERAL.ACCOUNT_DOES_NOT_EXIST, { name: name });
}
