import { getAccountByName } from "secret-polar";

import { SampleProjectContract } from "../artifacts/typescript_schema/SampleProjectContract";

export default async function run () {
  const runTs = String(new Date());
  const contract_owner = await getAccountByName("account_0");
  const contract = new SampleProjectContract();
  await contract.setupClient();

  const deploy_response = await contract.deploy(
    contract_owner,
    { // custom fees
      amount: [{ amount: "750000", denom: "uscrt" }],
      gas: "3000000",
    }
  );
  console.log(deploy_response);

  const customFees = { // custom fees
    amount: [{ amount: "750000", denom: "uscrt" }],
    gas: "3000000",
  };
  const contract_info = await contract.instantiate(
    {"count": 102},
    `deploy test ${runTs}`,
    contract_owner,
    undefined,  // transferAmount
    customFees,
  );
  console.log(contract_info);

  const inc_response = await contract.increment({account: contract_owner});
  console.log(inc_response);

  const response = await contract.getCount();
  console.log(response);

  const ex_response = await contract.increment(
    {account: contract_owner, customFees: customFees}
  );
  console.log(ex_response);
}
