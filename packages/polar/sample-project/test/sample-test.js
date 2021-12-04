const { expect, use } = require("chai");
const { Contract, getAccountByName, polarChai } = require("secret-polar");

use(polarChai);

describe("sample_project", () => {
  async function setup() {
    const contract_owner = getAccountByName("account_1");
    const other = getAccountByName("account_0");
    const contract = new Contract("sample-project");
    await contract.parseSchema();

    return { contract_owner, other, contract };
  }

  it("deploy and init", async () => {
    const { contract_owner, other, contract } = await setup();
    const deploy_response = await contract.deploy(contract_owner);

    const contract_info = await contract.instantiate({"count": 102}, "deploy test", contract_owner);

    await expect(contract.query.get_count()).to.respondWith({ 'count': 102 });
    // await expect(contract.query.get_count()).to.respondWith({ 'count': 1000 }); // this will fail
  });

  it("unauthorized reset", async () => {
    const { contract_owner, other, contract } = await setup();
    const deploy_response = await contract.deploy(contract_owner);

    const contract_info = await contract.instantiate({"count": 102}, "deploy test", contract_owner);

    await expect(contract.tx.reset(other, [], 100)).to.be.revertedWith("unauthorized");
  });

  it("increment", async () => {
    const { contract_owner, other, contract } = await setup();
    const deploy_response = await contract.deploy(contract_owner);

    const contract_info = await contract.instantiate({"count": 102}, "deploy test", contract_owner);

    const ex_response = await contract.tx.increment(contract_owner, []);
    await expect(contract.query.get_count()).to.respondWith({ 'count': 103 });
  });
});
