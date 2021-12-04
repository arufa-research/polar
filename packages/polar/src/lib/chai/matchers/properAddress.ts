export function supportProperAddress (Assertion: Chai.AssertionStatic): void {
  Assertion.addProperty('properAddress', function (this: any) { // eslint-disable-line  @typescript-eslint/no-explicit-any
    const subject = this._obj as string;
    this.assert(
      /^0x[0-9-a-fA-F]{40}$/.test(subject),
      `Expected "${subject}" to be a proper address`,
      `Expected "${subject}" not to be a proper address`,
      'proper address (eg.: 0x1234567890123456789012345678901234567890)',
      subject
    );
  });
}
