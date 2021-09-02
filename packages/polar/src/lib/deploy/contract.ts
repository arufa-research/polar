import chalk from "chalk";
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
import { Account, ContractInfo, PolarRuntimeEnvironment } from "../../types";
import { getClient, getSigningClient } from "../client";

export class Contract {
  readonly contractName: string;
  readonly contractPath: string;
  readonly schemaPath: string;
  readonly env: PolarRuntimeEnvironment;
  readonly account: Account | undefined;
  readonly client: CosmWasmClient;
  signingClient: SigningCosmWasmClient | undefined = undefined;

  codeId: number;
  contractCodeHash: string;
  contractAddress: string;

  constructor (contractName: string, env: PolarRuntimeEnvironment, account?: Account | undefined) {
    this.contractName = contractName;
    this.contractPath = path.join(ARTIFACTS_DIR, "contracts", `${contractName}.wasm`);
    this.schemaPath = path.join(SCHEMA_DIR, `${contractName}.json`);

    this.env = env;
    this.client = getClient(env.network);
    this.account = account;

    if (account === undefined) {
      console.log("Warning: Account not initialized for contract ", chalk.cyan(contractName));
    }

    if (!fs.existsSync(this.contractPath)) {
      throw new PolarError(ERRORS.ARTIFACTS.NOT_FOUND, {
        param: this.contractName
      });
    }

    if (!fs.existsSync(this.schemaPath)) {
      console.log("Warning: Schema not found for contract ", chalk.cyan(contractName));
    }
  }

  async deploy (): Promise<ContractInfo> {
    const wasmFileContent: Buffer = fs.readFileSync(this.contractPath);

    if (this.account === undefined) {
      throw new PolarError(ERRORS.GENERAL.ACCOUNT_NOT_PASSED, {
        param: this.contractName
      });
    }

    if (this.signingClient === undefined) {
      this.signingClient = await getSigningClient(this.env.network, (this.account));
    }
    const uploadReceipt = await this.signingClient.upload(wasmFileContent, {});
    const codeId: number = uploadReceipt.codeId;
    const contractCodeHash: string =
      await this.signingClient.restClient.getCodeHashByCodeId(codeId);

    this.codeId = codeId;

    return {
      codeId: this.codeId,
      contractCodeHash: this.contractCodeHash
    };
  }

  // async deployed() {

  // }

  async instantiate (
    initArgs: object, // eslint-disable-line @typescript-eslint/ban-types
    label: string
  ): Promise<ContractInfo> {
    if (this.account === undefined) {
      throw new PolarError(ERRORS.GENERAL.ACCOUNT_NOT_PASSED, {
        param: this.contractName
      });
    }

    if (this.signingClient === undefined) {
      this.signingClient = await getSigningClient(this.env.network, (this.account));
    }

    const contract = await this.signingClient.instantiate(this.codeId, initArgs, label);
    this.contractAddress = contract.contractAddress;

    return {
      codeId: this.codeId,
      contractCodeHash: this.contractCodeHash,
      contractAddress: this.contractAddress
    };
  }

  // TODO: replace query and execute with methods from schema json
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
