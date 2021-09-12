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
import type {
  Account,
  AnyJson,
  ContractFunction,
  ContractInfo,
  PolarRuntimeEnvironment
} from "../../types";
import { getClient, getSigningClient, ExecuteResult } from "../client";
import { Abi, AbiParam } from "./abi";

function buildCall (
  contract: Contract,
  msgName: string,
  argNames: AbiParam[]
): ContractFunction<any> {
  return async function (
    ...args: any[]
  ): Promise<any> {
    if (args.length !== argNames.length) {
      console.error(`Invalid ${msgName} call. Argument count ${args.length}, expected ${argNames.length}`);
      return;
    }

    const msgArgs: any = {};
    argNames.forEach((abiParam, i) => {
      msgArgs[abiParam.name] = args[i];
    });

    // Query the current count
    return contract.queryMsg(msgName, msgArgs);
  };
}

function buildSend (
  contract: Contract,
  msgName: string,
  argNames: AbiParam[]
): ContractFunction<any> {
  return async function (
    ...args: any[]
  ): Promise<any> {
    if (args.length !== argNames.length + 1) {
      console.error(`Invalid ${msgName} call. Argument count ${args.length}, expected ${argNames.length + 1}`);
      return;
    }

    if (
      args[args.length - 1].address === undefined ||
      args[args.length - 1].name === undefined ||
      args[args.length - 1].mnemonic === undefined
    ) {
      console.error(`Invalid ${msgName} call. Last argument should be an account object.`);
      return;
    }

    const account: Account = (args[args.length - 1] as Account);

    const msgArgs: any = {};
    argNames.forEach((abiParam, i) => {
      msgArgs[abiParam.name] = args[i];
    });

    // Query the current count
    return contract.executeMsg(msgName, msgArgs, account);
  };
}

export class Contract {
  readonly contractName: string;
  readonly contractPath: string;
  readonly initSchemaPath: string;
  readonly querySchemaPath: string;
  readonly executeSchemaPath: string;
  readonly initAbi: Abi;
  readonly queryAbi: Abi;
  readonly executeAbi: Abi;
  readonly env: PolarRuntimeEnvironment;
  readonly client: CosmWasmClient;

  private codeId: number;
  private readonly contractCodeHash: string;
  private contractAddress: string;

  public query: {
    [name: string]: ContractFunction<any>
  };

  public tx: {
    [name: string]: ContractFunction<any>
  };

  constructor (contractName: string, env: PolarRuntimeEnvironment) {
    this.contractName = contractName.replace('-', '_');
    this.codeId = 0;
    this.contractCodeHash = "mock_hash";
    this.contractAddress = "mock_address";
    this.contractPath = path.join(ARTIFACTS_DIR, "contracts", `${this.contractName}.wasm`);

    this.initSchemaPath = path.join(SCHEMA_DIR, this.contractName, "init_msg.json");
    this.querySchemaPath = path.join(SCHEMA_DIR, this.contractName, "query_msg.json");
    this.executeSchemaPath = path.join(SCHEMA_DIR, this.contractName, "handle_msg.json");

    if (!fs.existsSync(this.contractPath)) {
      throw new PolarError(ERRORS.ARTIFACTS.NOT_FOUND, {
        param: contractName
      });
    }
    if (!fs.existsSync(this.initSchemaPath)) {
      console.log("Warning: Init schema not found for contract ", chalk.cyan(contractName));
    }
    if (!fs.existsSync(this.querySchemaPath)) {
      console.log("Warning: Query schema not found for contract ", chalk.cyan(contractName));
    }
    if (!fs.existsSync(this.executeSchemaPath)) {
      console.log("Warning: Execute schema not found for contract ", chalk.cyan(contractName));
    }

    const initSchemaJson: AnyJson = fs.readJsonSync(this.initSchemaPath);
    const querySchemaJson: AnyJson = fs.readJsonSync(this.querySchemaPath);
    const executeSchemaJson: AnyJson = fs.readJsonSync(this.executeSchemaPath);
    this.initAbi = new Abi(initSchemaJson);
    this.queryAbi = new Abi(querySchemaJson);
    this.executeAbi = new Abi(executeSchemaJson);

    this.query = {};
    this.tx = {};

    this.env = env;
    this.client = getClient(env.network);
  }

  async parseSchema (): Promise<void> {
    await this.queryAbi.parseSchema();
    await this.executeAbi.parseSchema();

    for (const message of this.queryAbi.messages) {
      const msgName: string = message.identifier;
      const args: AbiParam[] = message.args;

      if (this.query[msgName] == null) {
        this.query[msgName] = buildCall(this, msgName, args);
      }
    }

    for (const message of this.executeAbi.messages) {
      const msgName: string = message.identifier;
      const args: AbiParam[] = message.args;

      if (this.tx[msgName] == null) {
        this.tx[msgName] = buildSend(this, msgName, args);
      }
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

    return contractCodeHash;
  }

  // async deployed() {

  // }

  async instantiate (
    initArgs: object, // eslint-disable-line @typescript-eslint/ban-types
    label: string,
    account: Account
  ): Promise<ContractInfo> {
    const signingClient = await getSigningClient(this.env.network, (account));

    const contract = await signingClient.instantiate(this.codeId, initArgs, label);
    this.contractAddress = contract.contractAddress;

    return {
      codeId: this.codeId,
      contractCodeHash: this.contractCodeHash,
      contractAddress: this.contractAddress
    };
  }

  async queryMsg (
    methodName: string,
    callArgs: object // eslint-disable-line @typescript-eslint/ban-types
  ): Promise<any> {
    // Query the contract
    console.log('Querying contract for ', methodName);
    return await this.client.queryContractSmart(this.contractAddress, { methodName: callArgs });
  }

  async executeMsg (
    methodName: string,
    callArgs: object, // eslint-disable-line @typescript-eslint/ban-types
    account: Account
  ): Promise<ExecuteResult> {
    // Send execute msg to the contract
    const signingClient = await getSigningClient(this.env.network, (account));

    // Send the same handleMsg to increment multiple times
    return await signingClient.execute(
      this.contractAddress,
      callArgs
    );
  }
}
