import {
  Block,
  isTxError, MnemonicKey,
  MsgExecuteContract, MsgInstantiateContract, MsgStoreCode, TxBroadcastResult,
  TxError, TxSuccess
} from '@terra-money/terra.js';
import chalk from "chalk";
import fs from "fs-extra";
import path from "path";

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
  ContractFunction,
  DeployInfo,
  InstantiateInfo,
  PolarRuntimeEnvironment,
  UserAccount
} from "../../types";
import { loadCheckpoint, persistCheckpoint } from "../checkpoints";
import { getClient } from "../client";
import { Abi, AbiParam } from "./abi";

function buildCall (
  contract: Contract,
  msgName: string,
  argNames: AbiParam[]
): ContractFunction<any> { // eslint-disable-line  @typescript-eslint/no-explicit-any
  return async function (
    ...args: any[] // eslint-disable-line  @typescript-eslint/no-explicit-any
  ): Promise<any> { // eslint-disable-line  @typescript-eslint/no-explicit-any
    if (args.length !== argNames.length) {
      console.error(`Invalid ${msgName} call. Argument count ${args.length}, expected ${argNames.length}`);
      return;
    }
    const msgArgs: any = {}; // eslint-disable-line  @typescript-eslint/no-explicit-any
    argNames.forEach((abiParam, i) => {
      msgArgs[abiParam.name] = args[i];
    });

    // Query function
    return contract.queryMsg(msgName, msgArgs);
  };
}

function buildSend (
  contract: Contract,
  msgName: string,
  argNames: AbiParam[]
): ContractFunction<any> { // eslint-disable-line  @typescript-eslint/no-explicit-any
  return async function (
    ...args: any[] // eslint-disable-line  @typescript-eslint/no-explicit-any
  ): Promise<any> { // eslint-disable-line  @typescript-eslint/no-explicit-any
    if (args.length !== argNames.length + 1) {
      console.error(`Invalid ${msgName} call. Argument count ${args.length}, expected ${argNames.length + 1}`);
      return;
    }

    const accountVal = args[args.length - 1].account !== undefined
      ? args[args.length - 1].account : args[args.length - 1];
    if (
      accountVal.address === undefined ||
      accountVal.name === undefined ||
      accountVal.mnemonic === undefined
    ) {
      console.error(`Invalid ${msgName} call. Last argument should be an account object.`);
      return;
    }

    const account: Account = accountVal as Account;
    const msgArgs: any = {}; // eslint-disable-line  @typescript-eslint/no-explicit-any
    argNames.forEach((abiParam, i) => {
      msgArgs[abiParam.name] = args[i];
    });

    // Execute function (write)
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

  private codeId: string;
  private contractCodeHash: string;
  private readonly contractAddress: string;
  private checkpointData: Checkpoints;
  private readonly checkpointPath: string;

  public query: {
    [name: string]: ContractFunction<any> // eslint-disable-line  @typescript-eslint/no-explicit-any
  };

  public tx: {
    [name: string]: ContractFunction<any> // eslint-disable-line  @typescript-eslint/no-explicit-any
  };

  constructor (contractName: string, env: PolarRuntimeEnvironment) {
    this.contractName = replaceAll(contractName, '-', '_');
    this.codeId = "0";
    this.contractCodeHash = "mock_hash";
    this.contractAddress = "mock_address";
    this.contractPath = path.join(ARTIFACTS_DIR, "contracts", `${this.contractName}_compressed.wasm`);

    this.initSchemaPath = path.join(SCHEMA_DIR, this.contractName, "init_msg.json");
    this.querySchemaPath = path.join(SCHEMA_DIR, this.contractName, "query_msg.json");
    this.executeSchemaPath = path.join(SCHEMA_DIR, this.contractName, "handle_msg.json");

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

    // Load checkpoints
    this.checkpointPath = path.join(ARTIFACTS_DIR, "checkpoints", `${this.contractName}.yaml`);
    // file exist load it else create new checkpoint
    if (fs.existsSync(this.checkpointPath)) {
      this.checkpointData = loadCheckpoint(this.checkpointPath);
      const contractHash = this.checkpointData[env.network.name].deployInfo?.contractCodeHash;
      const contractCodeId = this.checkpointData[env.network.name].deployInfo?.codeId;
      const contractAddr = this.checkpointData[env.network.name].instantiateInfo?.contractAddress;
      this.contractCodeHash = contractHash ?? "mock_hash";
      this.codeId = contractCodeId ?? "0";
      this.contractAddress = contractAddr ?? "mock_address";
    } else {
      this.checkpointData = {};
    }

    this.env = env;
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

  async deploy (account: Account): Promise<DeployInfo> {
    const info = this.checkpointData[this.env.network.name]?.deployInfo;
    if (info) {
      console.log("Warning: contract already deployed, using checkpoints");
      return info;
    }
    await compress(this.contractName);

    const wasmFileContent = fs.readFileSync(this.contractPath).toString('base64');

    const mk = new MnemonicKey({
      mnemonic: account.mnemonic
    });
    const terra = getClient(this.env.network);
    const wallet = terra.wallet(mk);

    const storeCode = new MsgStoreCode(
      wallet.key.accAddress,
      wasmFileContent
    );
    const storeCodeTx = await wallet.createAndSignTx({
      msgs: [storeCode]
    });
    const storeCodeTxResult = await terra.tx.broadcast(storeCodeTx);

    console.log(storeCodeTxResult);

    if (isTxError(storeCodeTxResult)) {
      throw new Error(
        `store code failed. code: ${storeCodeTxResult.code}, codespace: ${storeCodeTxResult.codespace}, raw_log: ${storeCodeTxResult.raw_log}`); // eslint-disable-line @typescript-eslint/restrict-template-expressions
    }
    const {
      store_code: { codeId }
    } = storeCodeTxResult.logs[0].eventsByType;

    this.codeId = codeId[0];
    const deployInfo: DeployInfo = {
      codeId: codeId[0],
      contractCodeHash: "contractCodeHash",
      deployTimestamp: String(new Date())
    };
    this.checkpointData[this.env.network.name] =
      { ...this.checkpointData[this.env.network.name], deployInfo };
    this.contractCodeHash = "contractCodeHash";
    persistCheckpoint(this.checkpointPath, this.checkpointData);

    return deployInfo;
  }

  async instantiate (
    initArgs: object, // eslint-disable-line @typescript-eslint/ban-types
    label: string,
    account: Account
  ): Promise<InstantiateInfo> {
    const mk = new MnemonicKey({
      mnemonic: account.mnemonic
    });
    const terra = getClient(this.env.network);
    const wallet = terra.wallet(mk);
    const instantiate = new MsgInstantiateContract(
      wallet.key.accAddress,
      wallet.key.accAddress,
      1, // code ID
      initArgs // InitMsg
    );

    const instantiateTx = await wallet.createAndSignTx({
      msgs: [instantiate]
    });
    const instantiateTxResult = await terra.tx.broadcast(instantiateTx);

    console.log(instantiateTxResult);

    if (isTxError(instantiateTxResult)) {
      throw new Error(
        `instantiate failed. code: ${instantiateTxResult.code}, codespace: ${instantiateTxResult.codespace}, raw_log: ${instantiateTxResult.raw_log}`); // eslint-disable-line @typescript-eslint/restrict-template-expressions
    }
    const {
      instantiate_contract: { contractAddress }
    } = instantiateTxResult.logs[0].eventsByType;
    const instantiateInfo: InstantiateInfo = {
      contractAddress: contractAddress[0],
      instantiateTimestamp: String(new Date())
    };

    this.checkpointData[this.env.network.name] =
      { ...this.checkpointData[this.env.network.name], instantiateInfo };
    persistCheckpoint(this.checkpointPath, this.checkpointData);
    return instantiateInfo;
  }

  async queryMsg (
    methodName: string,
    callArgs: object // eslint-disable-line @typescript-eslint/ban-types
  ): Promise<any> { // eslint-disable-line  @typescript-eslint/no-explicit-any
    if (this.contractAddress === "mock_address") {
      throw new PolarError(ERRORS.GENERAL.CONTRACT_NOT_INSTANTIATED, {
        param: this.contractName
      });
    }
    // Query the contract
    console.log('Querying contract for ', methodName);
    const terra = getClient(this.env.network);
    const msgData: { [key: string]: object } = {}; // eslint-disable-line @typescript-eslint/ban-types
    msgData[methodName] = callArgs;
    console.log(this.contractAddress, msgData);
    return await terra.wasm.contractQuery(
      this.contractAddress,
      msgData // query msg
    );
  }

  async executeMsg (
    methodName: string,
    callArgs: object, // eslint-disable-line @typescript-eslint/ban-types
    account: Account
  ): Promise<any> {
    if (this.contractAddress === "mock_address") {
      throw new PolarError(ERRORS.GENERAL.CONTRACT_NOT_INSTANTIATED, {
        param: this.contractName
      });
    }

    const mk = new MnemonicKey({
      mnemonic: account.mnemonic
    });
    const terra = getClient(this.env.network);
    const wallet = terra.wallet(mk);
    const msgData: { [key: string]: object } = {}; // eslint-disable-line @typescript-eslint/ban-types
    msgData[methodName] = callArgs;
    console.log(this.contractAddress, msgData);
    const execute = new MsgExecuteContract(
      wallet.key.accAddress, // sender
      this.contractAddress, // contract account address
      msgData, // handle msg
      { uluna: 100000 } // coins
    );

    const executeTx = await wallet.createAndSignTx({
      msgs: [execute]
    });

    return await terra.tx.broadcast(executeTx);
  }
}
