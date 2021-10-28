export function supportProperHex (Assertion: Chai.AssertionStatic): void {
  Assertion.addMethod('properHex', function (this: any, length: number) { // eslint-disable-line  @typescript-eslint/no-explicit-any
    const subject = this._obj as string;
    const regexp = new RegExp(`^0x[0-9-a-fA-F]{${length}}$`);
    this.assert(regexp.test(subject),
      `Expected "${subject}" to be a proper hex of length ${length}`,
      `Expected "${subject}" not to be a proper hex of length ${length}, but it was`,
      'proper hex (eg.: 0x12345f5a7)',
      subject);
  });
}
