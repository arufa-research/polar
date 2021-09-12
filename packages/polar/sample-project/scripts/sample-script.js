const { Contract, createAccounts } = require("secret-polar");


async function run (runtimeEnv) {
  const masterAccount = await createAccounts(1);

  const contract = new Contract('sample-project', runtimeEnv);
  await contract.parseSchema();

  console.log(masterAccount);
  console.log(contract);

}

module.exports = { default: run };
