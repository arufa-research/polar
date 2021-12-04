
export function supportRevertedWith (Assertion: Chai.AssertionStatic): void {
  Assertion.addMethod('revertedWith', function (this: any, revertReason: string) { // eslint-disable-line  @typescript-eslint/no-explicit-any
    const promise = this._obj;

    const onSuccess = (value: any): any => { // eslint-disable-line  @typescript-eslint/no-explicit-any
      this.assert(
        false,
        'Expected transaction to be reverted',
        'Expected transaction NOT to be reverted',
        'Transaction reverted.',
        'Transaction NOT reverted.'
      );
      return value;
    };

    const onError = (error: any): any => { // eslint-disable-line  @typescript-eslint/no-explicit-any
      const message = (error instanceof Object && 'message' in error) ? error.message : JSON.stringify(error);
      const isReverted = message.toLowerCase().includes(revertReason.toLowerCase());

      this.assert(
        isReverted,
        `Expected transaction to be reverted with ${revertReason}, but other exception was thrown: ${message as string}`,
        `Expected transaction NOT to be reverted with ${revertReason}`,
        `Transaction reverted with ${revertReason}.`,
        error
      );
      return error;
    };

    const derivedPromise = promise.then(onSuccess, onError);
    this.then = derivedPromise.then.bind(derivedPromise);
    this.catch = derivedPromise.catch.bind(derivedPromise);
    return this;
  });
}
