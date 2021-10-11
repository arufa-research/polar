const { Contract, getAccountByName } = require("secret-polar");

async function run (runtimeEnv) {
  const contract_owner = getAccountByName("account_0", runtimeEnv);
  const contract = new Contract('sample-project', runtimeEnv);
  await contract.parseSchema();

  const deploy_response = await contract.deploy(contract_owner);
  console.log(deploy_response);

  const contract_info = await contract.instantiate({"display": " "}, "deploy test", contract_owner);
  console.log(contract_info);

  const ex_response = await contract.display(contract_owner);
  console.log(ex_response);

  const response = await contract.query_display();
  console.log(response);
}

module.exports = { default: run };
