/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-use-before-define */
/* eslint-disable @typescript-eslint/method-signature-style */
// <reference types="chai" /> maybe import chai types here

declare namespace Chai {
  interface Assertion
    extends LanguageChains, NumericComparison, TypeComparison {
    reverted(): AsyncAssertion
    revertedWith(revertReason: string): AsyncAssertion
    respondWith(responseMessage: any): AsyncAssertion // eslint-disable-line  @typescript-eslint/no-explicit-any
    properHex(length: number): void
    properAddress(): void
    properSecretAddress(): void
    changeScrtBalance(
      account: string, balanceChange: number, includeFee?: boolean, logResponse?: boolean
    ): AsyncAssertion
    changeTokenBalance(
      account: string, token: string, balanceChange: number, logResponse?: boolean
    ): AsyncAssertion
    changeTokenBalances(
      accounts: string[], token: string, balanceChanges: number[], logResponse?: boolean
    ): AsyncAssertion
  }

  interface AsyncAssertion extends Assertion, Promise<void> {}

  interface EmitAssertion extends AsyncAssertion {
    withArgs(...args: any[]): AsyncAssertion // eslint-disable-line  @typescript-eslint/no-explicit-any
  }
}
