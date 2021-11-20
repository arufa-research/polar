import { Account as WasmAccount } from "secretjs";

import { PolarContext } from "../../../internal/context";
import type {
  Account
} from "../../../types";
import { getClient } from "../../client";

export function supportChangeScrtBalance (Assertion: Chai.AssertionStatic): void {
  Assertion.addMethod('changeScrtBalance', function (
    this: any, // eslint-disable-line  @typescript-eslint/no-explicit-any
    account: Account | string,
    balanceChange: number,
    includeFee?: boolean
  ) {
    const subject = this._obj;

    const accountAddr: string = (account as Account).address !== undefined
      ? (account as Account).address : (account as string);
    const derivedPromise = Promise.all([
      getBalanceChange(subject, accountAddr, includeFee)
    ]).then(([actualChange]) => {
      this.assert(
        actualChange === balanceChange,
        `Expected "${accountAddr}" to change balance by ${balanceChange} uscrt, ` +
          `but it has changed by ${actualChange} uscrt`,
        `Expected "${accountAddr}" to not change balance by ${balanceChange} uscrt,`,
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

export async function getBalanceChange (
  transaction: (() => Promise<any>), // eslint-disable-line  @typescript-eslint/no-explicit-any
  accountAddr: string,
  includeFee?: boolean
): Promise<number> {
  if (typeof transaction !== 'function') {
    // raise exception, should be function
  }

  const client = getClient(PolarContext.getPolarContext().getRuntimeEnv().network);

  const balanceBefore =
    Number((await client.getAccount(accountAddr) as WasmAccount).balance[0].amount);

  const txResponse = await transaction();

  const balanceAfter =
    Number((await client.getAccount(accountAddr) as WasmAccount).balance[0].amount);

  // if (
  //   options?.includeFee !== true &&
  //   (await getAddressOf(account)) === txResponse.from
  // ) {
  //   const txFeeEvent = txResponse.result.findRecord('balances', 'Deposit');
  //   if (txFeeEvent) {
  //     if (txFeeEvent.event.data[0].toString() === txResponse.from) {
  //       return balanceAfter.sub(balanceBefore);
  //     } else {
  //       return balanceAfter
  //         .add(txFeeEvent.event.data[1] as any)
  //         .sub(balanceBefore);
  //     }
  //   } else {
  //     return balanceAfter.sub(balanceBefore);
  //   }
  // } else {
  return (balanceBefore - balanceAfter);
  // }
}
