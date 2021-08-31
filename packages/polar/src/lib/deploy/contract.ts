import fs from "fs-extra";
import path from "path";
import { CosmWasmClient, SigningCosmWasmClient } from "secretjs";

import { PolarError } from "../../internal/core/errors";
import { ERRORS } from "../../internal/core/errors-list";
import {
  ARTIFACTS_DIR,
  CONTRACTS_DIR,
  SCHEMA_DIR
} from "../../internal/core/project-structure";
import { Account, PolarRuntimeEnvironment } from "../../types";
import { getClient, getSigningClient } from "../client";

export class Contract {
  readonly contract_path: string;
  readonly schema_path: string;
  readonly env: PolarRuntimeEnvironment;
  readonly client: CosmWasmClient;
  readonly signingClient: SigningCosmWasmClient;

  codeId: number;
  contractAddress: string;

  constructor (contractName: string, account: Account, env: PolarRuntimeEnvironment) {
    this.contract_path = path.join(ARTIFACTS_DIR, "contracts", `${contractName}.wasm`);
    this.schema_path = path.join(SCHEMA_DIR, `${contractName}.json`);

    this.env = env;
    this.client = getClient(env.network);
    this.signingClient = getSigningClient(env.network, account);

    if (!fs.existsSync(this.contract_path)) {
      // throw new PolarError(ERRORS.ARGUMENTS.PARAM_NAME_INVALID_CASING, {
      //   param: cLA
      // });
    }

    if (!fs.existsSync(this.schema_path)) {
      // TODO: log a warning that schema does not exist for this contract
    }
  }

  async deploy (): Promise<void> {
    const wasmFileContent: Buffer = fs.readFileSync(this.contract_path);

    const uploadReceipt = await this.signingClient.upload(wasmFileContent, {});
    const codeId: number = uploadReceipt.codeId;
    const contractCodeHash: string =
      await this.signingClient.restClient.getCodeHashByCodeId(codeId);

    this.codeId = codeId;
  }

  // async deployed() {

  // }

  async initiate (initArgs): Promise<void> {
    const contract = await this.signingClient.instantiate(this.codeId, initArgs, `Counter: ${Math.ceil(Math.random() * 10000)}`);
    console.log('contract: ', contract);

    const contractAddress: string = contract.contractAddress;
    this.contractAddress = contractAddress;
  }

  async query (methodName: string): Promise<void> {
    // Query the current count
    console.log('Querying contract for ', methodName);
    const response = await this.client.queryContractSmart(this.contractAddress, { methodName: {} });

    // console.log(`Count=${response.count}`);
  }

  async execute (methodName: string): Promise<void> {
    // Increment the counter with a multimessage
    const handleMsg = { increment: {} };

    // Send the same handleMsg to increment multiple times
    // const response = await this.signingClient.multiExecute(
    //   [
    //     {
    //       this.contractAddress,
    //       handleMsg
    //     },
    //     {
    //       this.contractAddress,
    //       handleMsg
    //     },
    //   ]
    // );
    // console.log('response: ', response);
  }
}
