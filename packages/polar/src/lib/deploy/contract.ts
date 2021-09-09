import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import { CosmWasmClient } from "secretjs";

import { PolarError } from "../../internal/core/errors";
import { ERRORS } from "../../internal/core/errors-list";
import {
  ARTIFACTS_DIR,
  SCHEMA_DIR
} from "../../internal/core/project-structure";
import { Account, Checkpoints, DeployInfo, InstantiateInfo, PolarRuntimeEnvironment } from "../../types";
import { loadCheckpoint } from "../checkpoints";
import { getClient, getSigningClient } from "../client";

export class Contract {
  readonly contractName: string;
  readonly contractPath: string;
  readonly schemaPath: string;
  readonly env: PolarRuntimeEnvironment;
  readonly client: CosmWasmClient;

  private codeId: number;
  private contractAddress: string;
  private checkpointData: Checkpoints;

  constructor (contractName: string, env: PolarRuntimeEnvironment) {
    this.contractName = contractName;
    this.codeId = -1;
    this.contractAddress = "mockAddress";
    this.contractPath = path.join(ARTIFACTS_DIR, "contracts", `${contractName}.wasm`);
    this.schemaPath = path.join(SCHEMA_DIR, `${contractName}.json`);

    // Load checkpoints
    const checkpointPath = path.join(ARTIFACTS_DIR, "contracts", `${contractName}.yaml`);
    this.checkpointData = loadCheckpoint(checkpointPath);

    this.env = env;
    this.client = getClient(env.network);

    if (!fs.existsSync(this.contractPath)) {
      throw new PolarError(ERRORS.ARTIFACTS.NOT_FOUND, {
        param: this.contractName
      });
    }

    if (!fs.existsSync(this.schemaPath)) {
      console.log("Warning: Schema not found for contract ", chalk.cyan(contractName));
    }
  }

  async deploy (account: Account): Promise<string> {
    const wasmFileContent: Buffer = fs.readFileSync(this.contractPath);

    const signingClient = await getSigningClient(this.env.network, (account));
    const uploadReceipt = await signingClient.upload(wasmFileContent, {});
    const codeId: number = uploadReceipt.codeId;
    const contractCodeHash: string =
      await signingClient.restClient.getCodeHashByCodeId(codeId);

    this.codeId = codeId;
    const deployInfo: DeployInfo = {
      codeId: codeId,
      contractCodeHash: contractCodeHash,
      deployTimestamp: String(new Date())
    };
    this.checkpointData[this.env.network.name] =
      { ...this.checkpointData[this.env.network.name], deployInfo };

    return contractCodeHash;
  }

  async instantiate (
    initArgs: object, // eslint-disable-line @typescript-eslint/ban-types
    label: string,
    account: Account
  ): Promise<InstantiateInfo> {
    // check if contract is present in checkpoints
    // checkpoints will be loaded with env
    // structure yaml file with map
    const signingClient = await getSigningClient(this.env.network, (account));

    const contract = await signingClient.instantiate(this.codeId, initArgs, label);
    this.contractAddress = contract.contractAddress;

    const instantiateInfo: InstantiateInfo = {
      contractAddress: this.contractAddress,
      instantiateTimestamp: String(new Date())
    };

    this.checkpointData[this.env.network.name] =
      { ...this.checkpointData[this.env.network.name], instantiateInfo };
    return instantiateInfo;
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
