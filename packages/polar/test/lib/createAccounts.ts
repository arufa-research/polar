import { assert } from "chai";

import { createAccounts } from "../../src/lib/createAccounts";

describe("Create accounts", () => {
  it("should create 1 account", async () => {
    const res = await createAccounts(1);

    assert.isDefined(res[0].address);
    assert.isDefined(res[0].name);
    assert.isDefined(res[0].mnemonic);
  });

  it("should create 3 accounts", async () => {
    const res = await createAccounts(3);

    for (let i = 0; i <= 2; ++i) {
      assert.isDefined(res[i].address);
      assert.isDefined(res[i].name);
      assert.isDefined(res[i].mnemonic);
    }
  });
});
