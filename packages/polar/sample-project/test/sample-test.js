const { expect, use } = require("chai");
const { Contract, getAccountByName, polarChai } = require("secret-polar");

use(polarChai);

async function run (runtimeEnv) {
  const contract_owner = getAccountByName("account_1");
  const other = getAccountByName("account_0");
  const contract = new Contract("sample-project");
  await contract.parseSchema();

  const deploy_response = await contract.deploy(contract_owner);
  console.log(deploy_response);

  const contract_info = await contract.instantiate({"count": 102}, "deploy test", contract_owner);
  console.log(contract_info);

  await expect(contract.tx.reset(other, [], 100)).to.be.revertedWith("unauthorized");

  await expect(contract.query.get_count()).to.respondWith({ 'count': 102 });

  await expect(contract.query.get_count()).to.respondWith({ 'count': 1000 }); // this will fail
}

module.exports = { default: run };
