import type {
  Account, PolarRuntimeEnvironment, UserAccount
} from "../../../types";
import { getAccountByName, UserAccountI } from "../../account";

interface BalanceChangeOptions {
  includeFee?: boolean
}

export function supportChangeBalance (Assertion: Chai.AssertionStatic): void {
  Assertion.addMethod('changeBalance', function (
    this: any, // eslint-disable-line  @typescript-eslint/no-explicit-any
    account: Account | string,
    balanceChange: number,
    options: BalanceChangeOptions
  ) {
    const subject = this._obj;

    const accountAddr: string = (account as Account).address !== undefined
      ? (account as Account).address : (account as string);
    const derivedPromise = Promise.all([
      getBalanceChange(subject, accountAddr, options)
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
  options?: BalanceChangeOptions
): Promise<number> {
  if (typeof transaction !== 'function') {
    // raise exception, should be function
  }

  const env: PolarRuntimeEnvironment | undefined = undefined;

  const account = getAccountByName(accountAddr, env) as UserAccount;// access env or client here

  const balanceAfter = Number((await account.getBalance())[0].amount);

  const txResponse = await transaction();

  const balanceBefore = Number((await account.getBalance())[0].amount);

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
  return (balanceAfter - balanceBefore);
  // }
}
