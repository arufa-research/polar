const { Contract, getAccountByName, getLogs } = require("secret-polar");

async function run () {
  const contract_owner = getAccountByName("account_0");
  const contract = new Contract("sample-project");
  await contract.parseSchema();

  const deploy_response = await contract.deploy(
    contract_owner,
    { // custom fees
      amount: [{ amount: "750000", denom: "uscrt" }],
      gas: "3000000",
    }
  );
  console.log(deploy_response);

  const contract_info = await contract.instantiate({"count": 102}, "deploy test", contract_owner);
  console.log(contract_info);

  // use below line if contract initiation done using another contract
  // const contract_addr = "secret76597235472354792347952394";
  // contract.instantiatedWithAddress(contract_addr);

  const inc_response = await contract.tx.increment({account: contract_owner});
  console.log(inc_response);
  // to get logs as a key:value object
  // console.log(getLogs(inc_response));

  const response = await contract.query.get_count();
  console.log(response);

  const transferAmount = [{"denom": "uscrt", "amount": "15000000"}] // 15 SCRT
  const customFees = { // custom fees
    amount: [{ amount: "750000", denom: "uscrt" }],
    gas: "3000000",
  }
  const ex_response = await contract.tx.increment(
    {account: contract_owner, transferAmount: transferAmount}
  );
  // const ex_response = await contract.tx.increment(
  //   {account: contract_owner, transferAmount: transferAmount, customFees: customFees}
  // );
  console.log(ex_response);
}

module.exports = { default: run };
