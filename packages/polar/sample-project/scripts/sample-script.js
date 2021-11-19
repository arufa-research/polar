const { Contract, getAccountByName } = require("secret-polar");

async function run (runtimeEnv) {
  const contract_owner = getAccountByName("account_0");
  const contract = new Contract('sample-project');
  await contract.parseSchema();

  const deploy_response = await contract.deploy(contract_owner);
  console.log(deploy_response);

  const contract_info = await contract.instantiate({"count": 102}, "deploy test", contract_owner);
  console.log(contract_info);

  const ex_response = await contract.tx.increment(contract_owner);
  console.log(ex_response);

  const response = await contract.query.get_count();
  console.log(response);
}

module.exports = { default: run };
