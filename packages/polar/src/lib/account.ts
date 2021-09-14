import { CosmWasmClient } from "secretjs";

import { PolarError } from "../internal/core/errors";
import { ERRORS } from "../internal/core/errors-list";
import { Account, PolarRuntimeEnvironment, UserAccount } from "../types";
import { getClient } from "./client";

export class UserAccountI implements UserAccount {
  account: Account;
  client: CosmWasmClient;

  constructor (account: Account, env: PolarRuntimeEnvironment) {
    this.account = account;
    this.client = getClient(env.network);
  }
  // eslint-disable-next-line
  async getAccountInfo (): Promise<any> {
    return await this.client.getAccount(this.account.address);
  }
  // eslint-disable-next-line
  async getBalance (): Promise<any> {
    const info = await this.client.getAccount(this.account.address);
    if (info?.balance === undefined) {
      throw new PolarError(ERRORS.GENERAL.BALANCE_UNDEFINED);
    }
    return info?.balance;
  }
  // eslint-disable-next-line
  async getPublicKey (): Promise<any> {
    const info = await this.client.getAccount(this.account.address);
    return info?.pubkey;
  }
  // eslint-disable-next-line
  async getAccountNumber (): Promise<any> {
    const info = await this.client.getAccount(this.account.address);
    return info?.accountNumber;
  }
  // eslint-disable-next-line
  async getSequence (): Promise<any> {
    const info = await this.client.getAccount(this.account.address);
    return info?.sequence;
  }
}

export function getAccountByName (name: string, env: PolarRuntimeEnvironment): (Account | UserAccount) {
  if (env.network.config.accounts === undefined) {
    throw new PolarError(ERRORS.GENERAL.ACCOUNT_DOES_NOT_EXIST);
  }
  for (const value of env.network.config.accounts) {
    if (value.name === name) {
      return new UserAccountI(value, env);
    }
  }
  throw new PolarError(ERRORS.GENERAL.ACCOUNT_DOES_NOT_EXIST);
}
