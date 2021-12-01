import chalk from "chalk";
import { Account as WasmAccount } from "secretjs";

import { PolarContext } from "../../../internal/context";
import { PolarError } from "../../../internal/core/errors";
import { ERRORS } from "../../../internal/core/errors-list";
import type {
  Account, Coin
} from "../../../types";
import { getClient } from "../../client";

export function supportChangeTokenBalance (Assertion: Chai.AssertionStatic): void {
  Assertion.addMethod('changeTokenBalance', function (
    this: any, // eslint-disable-line  @typescript-eslint/no-explicit-any
    account: Account | string,
    token: string,
    balanceChange: number,
    logResponse?: boolean
  ) {
    const subject = this._obj;

    const accountAddr: string = (account as Account).address !== undefined
      ? (account as Account).address : (account as string);
    const derivedPromise = Promise.all([
      getBalanceChange(subject, accountAddr, token, logResponse)
    ]).then(([actualChange]) => {
      this.assert(
        actualChange === balanceChange,
        `Expected "${accountAddr}" to change balance by ${balanceChange} ${token}, ` +
          `but it has changed by ${actualChange} ${token}`,
        `Expected "${accountAddr}" to not change balance by ${balanceChange} ${token},`,
        balanceChange,
        actualChange
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

export async function getBalanceChange (
  transaction: (() => Promise<any>), // eslint-disable-line  @typescript-eslint/no-explicit-any
  accountAddr: string,
  token: string,
  logResponse?: boolean
): Promise<number> {
  if (typeof transaction !== 'function') {
    throw new PolarError(ERRORS.GENERAL.NOT_A_FUNCTION, {
      param: transaction
    });
  }

  const client = getClient(PolarContext.getPolarContext().getRuntimeEnv().network);

  const balanceBefore = extractTokenBalance(
    (await client.getAccount(accountAddr) as WasmAccount).balance,
    token
  );

  const txResponse = await transaction();
  if (logResponse === true) {
    console.log(`${chalk.green("Transaction response:")} ${txResponse as string}`);
  }

  const balanceAfter = extractTokenBalance(
    (await client.getAccount(accountAddr) as WasmAccount).balance,
    token
  );

  return (balanceBefore - balanceAfter);
}
