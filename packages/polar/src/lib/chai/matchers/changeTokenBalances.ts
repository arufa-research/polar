import { Account as WasmAccount } from "secretjs";

import { PolarContext } from "../../../internal/context";
import type {
  Account, Coin
} from "../../../types";
import { getClient } from "../../client";

export function supportChangeTokenBalances (Assertion: Chai.AssertionStatic): void {
  Assertion.addMethod('changeTokenBalances', function (
    this: any, // eslint-disable-line  @typescript-eslint/no-explicit-any
    accounts: Account[] | string[],
    token: string,
    balanceChanges: number[]
  ) {
    const subject = this._obj;

    const accountAddresses = accounts.map((account: string | Account) =>
      (account as Account).address !== undefined
        ? (account as Account).address : (account as string));

    const derivedPromise = Promise.all([
      getBalanceChanges(subject, accountAddresses, token)
    ]).then(([actualChanges]) => {
      this.assert(
        actualChanges.every((change, ind) =>
          change === balanceChanges[ind]
        ),
          `Expected ${accountAddresses.toString()} to change balance by ${balanceChanges.toString()} ${token}, ` +
            `but it has changed by ${actualChanges.toString()} ${token}`,
          `Expected ${accountAddresses.toString()} to not change balance by ${balanceChanges.toString()} ${token},`,
          balanceChanges.map((balanceChange) => balanceChange.toString()),
          actualChanges.map((actualChange) => actualChange.toString())
      );
    });

    this.then = derivedPromise.then.bind(derivedPromise);
    this.catch = derivedPromise.catch.bind(derivedPromise);
    this.promise = derivedPromise;
    return this;
  });
}

function extractTokenBalance (
  balances: readonly Coin[],
  denom: string
): number {
  for (const coin of balances) {
    if (coin.denom === denom) {
      return Number(coin.amount);
    }
  }
  return 0;
}

async function getBalances (
  accountAddresses: string[],
  token: string
): Promise<number[]> {
  const client = getClient(PolarContext.getPolarContext().getRuntimeEnv().network);

  return await Promise.all(
    accountAddresses.map(async (accountAddr) => {
      return extractTokenBalance(
        (await client.getAccount(accountAddr) as WasmAccount).balance,
        token
      );
    })
  );
}

export async function getBalanceChanges (
  transaction: (() => Promise<any>), // eslint-disable-line  @typescript-eslint/no-explicit-any
  accountAddresses: string[],
  token: string
): Promise<number[]> {
  if (typeof transaction !== 'function') {
    // raise exception, should be function
  }

  const balancesBefore = await getBalances(accountAddresses, token);

  const txResponse = await transaction();

  const balancesAfter = await getBalances(accountAddresses, token);

  return balancesAfter.map((balance, ind) => balance - balancesBefore[ind]);
}
