const { Contract, createAccounts } = require("secret-polar");


async function run (runtimeEnv) {
  const contract = new Contract('sample-project', runtimeEnv);
  await contract.parseSchema();

  const account = runtimeEnv.config.networks.testnet.accounts[0];
  const deploy_response = await contract.deploy(account);
  console.log(deploy_response);

  const contract_info = await contract.instantiate({"count": 102}, "deploy test", account);
  console.log(contract_info);

  const ex_response = await contract.tx.increment(account);
  console.log(ex_response);

  const response = await contract.query.get_count();
  console.log(response);
}

module.exports = { default: run };
