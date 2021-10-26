import { Account as WasmAccount, CosmWasmClient } from "secretjs";
import { PubKey } from "secretjs/types/types";

import { PolarError } from "../internal/core/errors";
import { ERRORS } from "../internal/core/errors-list";
import { Account, Coin, PolarRuntimeEnvironment, UserAccount } from "../types";
import { getClient } from "./client";

export class UserAccountI implements UserAccount {
  account: Account;
  client: CosmWasmClient;

  constructor (account: Account, env: PolarRuntimeEnvironment) {
    this.account = account;
    this.client = getClient(env.network);
  }

  async getAccountInfo (): Promise<WasmAccount | undefined> {
    return await this.client.getAccount(this.account.address);
  }

  async getBalance (): Promise<readonly Coin[]> {
    const info = await this.client.getAccount(this.account.address);
    if (info?.balance === undefined) {
      throw new PolarError(ERRORS.GENERAL.BALANCE_UNDEFINED);
    }
    return info?.balance;
  }

  async getPublicKey (): Promise<PubKey | undefined> {
    const info = await this.client.getAccount(this.account.address);
    return info?.pubkey;
  }

  async getAccountNumber (): Promise<number | undefined> {
    const info = await this.client.getAccount(this.account.address);
    return info?.accountNumber;
  }

  async getSequence (): Promise<number | undefined> {
    const info = await this.client.getAccount(this.account.address);
    return info?.sequence;
  }
}

export function getAccountByName (
  name: string,
  env: PolarRuntimeEnvironment
): (Account | UserAccount) {
  if (env.network.config.accounts === undefined) {
    throw new PolarError(ERRORS.GENERAL.ACCOUNT_DOES_NOT_EXIST, { name: name });
  }
  for (const value of env.network.config.accounts) {
    if (value.name === name) {
      return new UserAccountI(value, env);
    }
  }
  throw new PolarError(ERRORS.GENERAL.ACCOUNT_DOES_NOT_EXIST, { name: name });
}
