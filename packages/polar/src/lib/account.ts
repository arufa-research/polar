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

  async getAccountInfo (): Promise<any> {
    return await this.client.getAccount(this.account.address);
  }

  async getBalance (): Promise<any> {
    const info = await this.client.getAccount(this.account.address);
    return info?.balance;
  }

  async getPublicKey (): Promise<any> {
    const info = await this.client.getAccount(this.account.address);
    return info?.pubkey;
  }

  async getAccountNumber (): Promise<any> {
    const info = await this.client.getAccount(this.account.address);
    return info?.accountNumber;
  }

  async getSequence (): Promise<any> {
    const info = await this.client.getAccount(this.account.address);
    return info?.sequence;
  }
}

export function getAccountByName (name: string, env: PolarRuntimeEnvironment): UserAccount {
  console.log(env.network);
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
