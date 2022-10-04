import { use } from "chai";
import { getAccountByName, polarChai } from "secret-polar";

import { SampleProjectContract } from "../artifacts/typescript_schema/SampleProjectContract";

use(polarChai);

describe("counter", () => {

  async function setup() {
    const contract_owner = await getAccountByName("account_0");
    const contract = new SampleProjectContract();
    await contract.setUpclient();

    return { contract_owner, contract };
  }

  it("deploy and init", async () => {
    const runTs = String(new Date());
    const { contract_owner, contract } = await setup();
    const deploy_response = await contract.deploy(
      contract_owner,
      { // custom fees
        amount: [{ amount: "90000", denom: "uscrt" }],
        gas: "35000000",
      }
    );
    console.log(deploy_response);
    const contract_info = await contract.instantiate(
      {
        "count": 102
      },
      `deploy test ${runTs}`,
      contract_owner,
    );
    console.log(contract_info);
  });
});
