export function supportProperPrivateKey (Assertion: Chai.AssertionStatic): void {
  Assertion.addProperty('properPrivateKey', function (this: any) { // eslint-disable-line  @typescript-eslint/no-explicit-any
    const subject = this._obj;
    this.assert(
      /^0x[0-9-a-fA-F]{64}$/.test(subject),
      `Expected "${subject as string}" to be a proper private key`,
      `Expected "${subject as string}" not to be a proper private key`,
      'proper private key (eg.: 0x123456789012345678901234567890123456789012345678901234567890ffff)',
      subject
    );
  });
}
