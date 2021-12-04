
export function supportReverted (Assertion: Chai.AssertionStatic): void {
  Assertion.addProperty('reverted', function (this: any): any { // eslint-disable-line  @typescript-eslint/no-explicit-any
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
      const isReverted = message.search('failed to execute message') >= 0;
      this.assert(
        isReverted,
        `Expected transaction to be reverted, but other exception was thrown: ${message as string}`,
        'Expected transaction NOT to be reverted',
        'Transaction reverted.',
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
