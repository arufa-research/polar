import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import { SecretNetworkClient } from "secretjs";

import { PolarContext } from "../../internal/context";
import { PolarError } from "../../internal/core/errors";
import { ERRORS } from "../../internal/core/errors-list";
import {
  ARTIFACTS_DIR,
  SCHEMA_DIR
} from "../../internal/core/project-structure";
import { replaceAll } from "../../internal/util/strings";
import { compress } from "../../lib/deploy/compress";
import type {
  Account,
  AnyJson,
  Checkpoints,
  Coin,
  ContractFunction,
  DeployInfo,
  InstantiateInfo,
  PolarRuntimeEnvironment,
  StdFee,
  UserAccount
} from "../../types";
import { loadCheckpoint, persistCheckpoint } from "../checkpoints";
import { getClient, getSigningClient } from "../client";
import { Abi, AbiParam } from "./abi";

function checkCallArgs (
  args: Record<string, unknown> | undefined,
  argNames: AbiParam[],
  msgName: string
): boolean {
  const validArgs = [];
  for (const argName of argNames) {
    validArgs.push(argName.name);
  }
  if (args !== undefined) {
    const argKeys = Object.keys(args);
    // argKeys should be a subset of validArgs
    for (const key of argKeys) {
      if (!(validArgs.includes(key))) {
        console.error(`Invalid ${msgName} call. Argument '${key}' not an argument of '${msgName}' method`);
        return false;
      }
    }
  }
  return true;
}

function buildCall (
  contract: Contract,
  msgName: string,
  argNames: AbiParam[]
): ContractFunction<any> { // eslint-disable-line  @typescript-eslint/no-explicit-any
  return async function (
    args?: Record<string, unknown> | undefined
  ): Promise<any> { // eslint-disable-line  @typescript-eslint/no-explicit-any
    if (!checkCallArgs(args, argNames, msgName)) {
      return;
    }

    // Query function
    return await contract.queryMsg(msgName, args !== undefined ? args : {});
  };
}

export interface ExecArgs {
  account: Account | UserAccount
  transferAmount: readonly Coin[] | undefined
  customFees: StdFee | undefined
}

function buildSend (
  contract: Contract,
  msgName: string,
  argNames: AbiParam[]
): ContractFunction<any> { // eslint-disable-line  @typescript-eslint/no-explicit-any
  return async function (
    { account, transferAmount, customFees }: ExecArgs,
    args?: Record<string, unknown> | undefined
  ): Promise<any> { // eslint-disable-line  @typescript-eslint/no-explicit-any
    if (transferAmount === []) {
      transferAmount = undefined;
    }

    if (!checkCallArgs(args, argNames, msgName)) {
      return;
    }

    const accountVal: Account = (account as UserAccount).account !== undefined
      ? (account as UserAccount).account : (account as Account);

    // Execute function (write)
    return await contract.executeMsg(
      msgName,
      args !== undefined ? args : {},
      accountVal,
      transferAmount as Coin[],
      customFees
    );
  };
}

export class Contract {
  readonly contractName: string;
  readonly contractPath: string;
  readonly initSchemaPath: string;
  readonly querySchemaPath: string;
  readonly executeSchemaPath: string;
  readonly responsePaths: string[] = [];
  readonly initAbi: Abi;
  readonly queryAbi: Abi;
  readonly executeAbi: Abi;
  readonly responseAbis: Abi[] = [];

  private readonly env: PolarRuntimeEnvironment = PolarContext.getPolarContext().getRuntimeEnv();
  private client?: SecretNetworkClient;

  public codeId: number;
  public contractCodeHash: string;
  public contractAddress: string;
  private checkpointData: Checkpoints;
  private readonly checkpointPath: string;

  public query: {
    [name: string]: ContractFunction<any> // eslint-disable-line  @typescript-eslint/no-explicit-any
  };

  public tx: {
    [name: string]: ContractFunction<any> // eslint-disable-line  @typescript-eslint/no-explicit-any
  };

  public responses: {
    [name: string]: AbiParam[]
  };

  constructor (contractName: string, instance?: string) {
    this.contractName = replaceAll(contractName, '-', '_');
    this.codeId = 0;
    this.contractCodeHash = "mock_hash";
    this.contractAddress = "mock_address";
    this.contractPath = path.join(ARTIFACTS_DIR, "contracts", `${this.contractName}_compressed.wasm`);

    this.initSchemaPath = path.join(SCHEMA_DIR, this.contractName, "init_msg.json");
    this.querySchemaPath = path.join(SCHEMA_DIR, this.contractName, "query_msg.json");
    this.executeSchemaPath = path.join(SCHEMA_DIR, this.contractName, "handle_msg.json");

    for (const file of fs.readdirSync(path.join(SCHEMA_DIR, this.contractName))) {
      if (file.split('.')[0].split('_')[1] !== "response") { // *_response.json
        continue;
      }
      this.responsePaths.push(path.join(SCHEMA_DIR, this.contractName, file));
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

    for (const file of this.responsePaths) {
      const responseSchemaJson: AnyJson = fs.readJSONSync(file);
      const responseAbi = new Abi(responseSchemaJson);
      this.responseAbis.push(responseAbi);
    }

    this.query = {};
    this.tx = {};
    this.responses = {};

    // Load checkpoints
    this.checkpointPath = path.join(ARTIFACTS_DIR, "checkpoints", `${this.contractName + (instance ?? "")}.yaml`);
    // For multiple instances
    const mainContract = path.join(ARTIFACTS_DIR, "checkpoints", `${this.contractName}.yaml`);
    if (fs.existsSync(mainContract)) {
      const data = loadCheckpoint(mainContract);
      delete data[this.env.network.name].instantiateInfo;
      persistCheckpoint(this.checkpointPath, data);
    }
    // file exist load it else create new checkpoint
    // skip checkpoints if test command is run, or skip-checkpoints is passed
    if (fs.existsSync(this.checkpointPath) &&
      this.env.runtimeArgs.useCheckpoints === true) {
      this.checkpointData = loadCheckpoint(this.checkpointPath);
      const contractHash = this.checkpointData[this.env.network.name].deployInfo?.contractCodeHash;
      const contractCodeId = this.checkpointData[this.env.network.name].deployInfo?.codeId;
      const contractAddr =
        this.checkpointData[this.env.network.name].instantiateInfo?.contractAddress;
      this.contractCodeHash = contractHash ?? "mock_hash";
      this.codeId = contractCodeId ?? 0;
      this.contractAddress = contractAddr ?? "mock_address";
    } else {
      this.checkpointData = {};
    }
  }

  async setupClient (): Promise<void> {
    this.client = await getClient(this.env.network);
  }

  async parseSchema (): Promise<void> {
    if (!fs.existsSync(this.querySchemaPath)) {
      throw new PolarError(ERRORS.ARTIFACTS.QUERY_SCHEMA_NOT_FOUND, {
        param: this.contractName
      });
    }
    if (!fs.existsSync(this.executeSchemaPath)) {
      throw new PolarError(ERRORS.ARTIFACTS.EXEC_SCHEMA_NOT_FOUND, {
        param: this.contractName
      });
    }
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

  async deploy (
    account: Account | UserAccount,
    customFees?: StdFee | undefined
  ): Promise<DeployInfo> {
    const accountVal: Account = (account as UserAccount).account !== undefined
      ? (account as UserAccount).account : (account as Account);
    const info = this.checkpointData[this.env.network.name]?.deployInfo;
    if (info) {
      console.log("Warning: contract already deployed, using checkpoints");
      return info;
    }
    await compress(this.contractName);

    const wasmFileContent: Buffer = fs.readFileSync(this.contractPath);

    const signingClient = await getSigningClient(this.env.network, accountVal);
    const uploadReceipt = await signingClient.tx.compute.storeCode(
      {
        sender: accountVal.address,
        wasmByteCode: wasmFileContent,
        source: "",
        builder: ""
      },
      {
        gasLimit: 1000_0000_00 // TODO: Fix fees
        // gasPriceInFeeDenom: customFees?.gas
      }
    );
    const res = uploadReceipt?.arrayLog?.find((log) => log.type === "message" && log.key === "code_id");
    if (res === undefined) {
      throw new Error("Response for storing code not received!");
    }
    const codeId = Number(res.value);

    const contractCodeHash = await signingClient.query.compute.codeHash(codeId);
    this.codeId = codeId;
    const deployInfo: DeployInfo = {
      codeId: codeId,
      contractCodeHash: contractCodeHash,
      deployTimestamp: String(new Date())
    };

    if (this.env.runtimeArgs.useCheckpoints === true) {
      this.checkpointData[this.env.network.name] =
        { ...this.checkpointData[this.env.network.name], deployInfo };
      persistCheckpoint(this.checkpointPath, this.checkpointData);
    }
    this.contractCodeHash = contractCodeHash;

    return deployInfo;
  }

  instantiatedWithAddress (
    address: string,
    timestamp?: Date | undefined
  ): void {
    const initTimestamp = (timestamp !== undefined) ? String(timestamp) : String(new Date());

    // contract address already exists
    if (this.contractAddress !== "mock_address") {
      console.log(
        `Contract ${this.contractName} already has address: ${this.contractAddress}, skipping`
      );
      return;
    } else {
      this.contractAddress = address;
    }

    const instantiateInfo: InstantiateInfo = {
      contractAddress: address,
      instantiateTimestamp: initTimestamp
    };

    // set init data (contract address, init timestamp) in checkpoints
    this.checkpointData[this.env.network.name] =
      { ...this.checkpointData[this.env.network.name], instantiateInfo };
    persistCheckpoint(this.checkpointPath, this.checkpointData);
  }

  async instantiate (
    initArgs: Record<string, unknown>,
    label: string,
    account: Account | UserAccount,
    transferAmount?: Coin[],
    customFees?: StdFee | undefined
  ): Promise<InstantiateInfo> {
    const accountVal: Account = (account as UserAccount).account !== undefined
      ? (account as UserAccount).account : (account as Account);
    if (this.contractCodeHash === "mock_hash") {
      throw new PolarError(ERRORS.GENERAL.CONTRACT_NOT_DEPLOYED, {
        param: this.contractName
      });
    }
    const info = this.checkpointData[this.env.network.name]?.instantiateInfo;
    if (info) {
      console.log("Warning: contract already instantiated, using checkpoints");
      return info;
    }
    const signingClient = await getSigningClient(this.env.network, accountVal);

    const initTimestamp = String(new Date());
    label = (this.env.runtimeArgs.command === "test")
      ? `deploy ${this.contractName} ${initTimestamp}` : label;
    console.log(`Instantiating with label: ${label}`);

    const tx = await signingClient.tx.compute.instantiateContract(
      {
        codeId: this.codeId,
        sender: accountVal.address,
        codeHash: this.contractCodeHash,
        initMsg: initArgs,
        label: label,
        initFunds: transferAmount
      },
      {
        gasLimit: 100_000 // TODO: check gas
      }
    );

    // Find the contract_address in the logs
    const res = tx?.arrayLog?.find(
      (log) => log.type === "message" && log.key === "contract_address"
    );
    if (res === undefined) {
      throw new Error("Response for storing code not received!");
    }
    this.contractAddress = res.value;

    const instantiateInfo: InstantiateInfo = {
      contractAddress: this.contractAddress,
      instantiateTimestamp: initTimestamp
    };

    if (this.env.runtimeArgs.useCheckpoints === true) {
      this.checkpointData[this.env.network.name] =
        { ...this.checkpointData[this.env.network.name], instantiateInfo };
      persistCheckpoint(this.checkpointPath, this.checkpointData);
    }
    return instantiateInfo;
  }

  async queryMsg (
    methodName: string,
    callArgs: Record<string, unknown>
  ): Promise<any> { // eslint-disable-line  @typescript-eslint/no-explicit-any
    if (this.contractAddress === "mock_address") {
      throw new PolarError(ERRORS.GENERAL.CONTRACT_NOT_INSTANTIATED, {
        param: this.contractName
      });
    }
    // Query the contract
    console.log('Querying contract for', methodName);
    const msgData: { [key: string]: Record<string, unknown> } = {};
    msgData[methodName] = callArgs;
    console.log(this.contractAddress, msgData);

    if (this.client === undefined) {
      throw new Error("Client is not loaded. Please load it using `await contractName.setupClient()`");
    }
    return await this.client.query.compute.queryContract(
      { contractAddress: this.contractAddress, query: msgData, codeHash: this.contractCodeHash }
    );
  }

  async executeMsg (
    methodName: string,
    callArgs: Record<string, unknown>,
    account: Account | UserAccount,
    transferAmount?: Coin[],
    customFees?: StdFee | undefined
  ): Promise<any> { // eslint-disable-line  @typescript-eslint/no-explicit-any
    const accountVal: Account = (account as UserAccount).account !== undefined
      ? (account as UserAccount).account : (account as Account);
    if (this.contractAddress === "mock_address") {
      throw new PolarError(ERRORS.GENERAL.CONTRACT_NOT_INSTANTIATED, {
        param: this.contractName
      });
    }
    // Send execute msg to the contract
    const signingClient = await getSigningClient(this.env.network, accountVal);

    const msgData: { [key: string]: Record<string, unknown> } = {};
    msgData[methodName] = callArgs;
    console.log(this.contractAddress, msgData);
    // Send the same handleMsg to increment multiple times
    return await signingClient.tx.compute.executeContract(
      {
        sender: accountVal.address,
        contractAddress: this.contractAddress,
        codeHash: this.contractCodeHash,
        msg: msgData,
        sentFunds: transferAmount
      },
      {
        gasLimit: 100_000 // TODO: check fees
      }
    );
  }
}
