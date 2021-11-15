/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-use-before-define */
/* eslint-disable @typescript-eslint/method-signature-style */
// <reference types="chai" /> maybe import chai types here

declare namespace Chai {
  interface Assertion
    extends LanguageChains, NumericComparison, TypeComparison {
    reverted(): AsyncAssertion
    revertedWith(reason: string): AsyncAssertion
    emit(contract: any, eventName: string): EmitAssertion
    properHex(length: number): void
    properAddress(): void
    properSecretAddress(): void
    changeBalance(account: any, balance: any, options?: any): AsyncAssertion
    changeBalances(
      accounts: any[],
      balances: any[],
      options?: any
    ): AsyncAssertion
    changeTokenBalance(token: any, account: any, balance: any): AsyncAssertion
    changeTokenBalances(
      token: any,
      accounts: any[],
      balances: any[]
    ): AsyncAssertion
    calledOnContract(contract: any): void
    calledOnContractWith(contract: any, parameters: any[]): void
  }

  type NumberComparer = (value: any, message?: string) => Assertion;

  interface AsyncAssertion extends Assertion, Promise<void> {}

  interface EmitAssertion extends AsyncAssertion {
    withArgs(...args: any[]): AsyncAssertion
  }
}