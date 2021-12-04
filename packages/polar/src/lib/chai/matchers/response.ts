
export function supportResponse (Assertion: Chai.AssertionStatic): void {
  Assertion.addMethod('respondWith', function (
    this: any, // eslint-disable-line  @typescript-eslint/no-explicit-any
    responseMessage: any // eslint-disable-line  @typescript-eslint/no-explicit-any
  ) {
    const subject = this._obj;

    const strResponse = JSON.stringify(responseMessage);

    const derivedPromise = subject.then((response: any) => { // eslint-disable-line  @typescript-eslint/no-explicit-any
      response = JSON.stringify(response);
      this.assert(
        response === strResponse,
        `Expected response "${strResponse}" to be returned, but ${response as string} was returned`,
        `Expected response "${strResponse}" NOT to be returned, but it was`
      );
    });

    this.then = derivedPromise.then.bind(derivedPromise);
    this.catch = derivedPromise.catch.bind(derivedPromise);
    this.promise = derivedPromise;
    this.responseMessage = responseMessage;
    return this;
  });
}
