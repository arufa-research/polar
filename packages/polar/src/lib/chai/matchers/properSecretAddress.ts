export function supportProperSecretAddress (Assertion: Chai.AssertionStatic): void {
  Assertion.addProperty('properSecretAddress', function (this: any) { // eslint-disable-line  @typescript-eslint/no-explicit-any
    const subject = this._obj as string;
    this.assert(
      /^secret[0-9-a-fA-F]{39}$/.test(subject),
      `Expected "${subject}" to be a proper secret address`,
      `Expected "${subject}" not to be a proper secret address`,
      'proper secret address (eg.: secret123456789012345678901234567890123456789)',
      subject
    );
  });
}
