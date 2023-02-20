import fs from "fs-extra";
import path from "path";
import { SecretNetworkClient } from "secretjs";

import { PolarContext } from "../../internal/context";
import { PolarError } from "../../internal/core/errors";
import { ERRORS } from "../../internal/core/errors-list";
import { ARTIFACTS_DIR } from "../../internal/core/project-structure";
import { replaceAll } from "../../internal/util/strings";
import { compress } from "../../lib/deploy/compress";
import type {
  Account,
  Checkpoints,
  Coin,
  DeployInfo,
  InstantiateInfo,
  PolarRuntimeEnvironment,
  TxnStdFee,
  UserAccount
} from "../../types";
import { loadCheckpoint, persistCheckpoint } from "../checkpoints";
import { getClient, getSigningClient } from "../client";

export interface ExecArgs {
  account: Account | UserAccount
  transferAmount: readonly Coin[] | undefined
  customFees: TxnStdFee | undefined
}

export class Contract {
  readonly contractName: string;
  readonly contractPath: string;

  private readonly env: PolarRuntimeEnvironment =
  PolarContext.getPolarContext().getRuntimeEnv();

  private client?: SecretNetworkClient;

  public codeId: number;
  public contractCodeHash: string;
  public contractAddress: string;
  public instantiateTag: string;
  private checkpointData: Checkpoints;
  private readonly checkpointPath: string;

  constructor (contractName: string, instantiateTag?: string) {
    this.contractName = replaceAll(contractName, "-", "_");
    this.codeId = 0;
    this.contractCodeHash = "mock_hash";
    this.contractAddress = "mock_address";
    this.contractPath = path.join(
      ARTIFACTS_DIR,
      "contracts",
      `${this.contractName}_compressed.wasm`
    );
    this.instantiateTag = instantiateTag ?? "default_instantiate";

    // Load checkpoints
    this.checkpointPath = path.join(ARTIFACTS_DIR, "checkpoints", `${this.contractName}.yaml`);
    // file exist load it else create new checkpoint
    // skip checkpoints if test command is run, or skip-checkpoints is passed
    if (fs.existsSync(this.checkpointPath) && this.env.runtimeArgs.useCheckpoints === true) {
      this.checkpointData = loadCheckpoint(this.checkpointPath);
      const contractHash =
        this.checkpointData[this.env.network.name]?.deployInfo?.contractCodeHash;
      const contractCodeId = this.checkpointData[this.env.network.name]?.deployInfo?.codeId;
      let contractAddr;
      // Load instantiate info for tag
      for (const value of this.checkpointData[this.env.network.name]?.instantiateInfo ?? []) {
        if (value.instantiateTag === this.instantiateTag) {
          contractAddr = value.contractAddress;
        }
      }
      this.contractCodeHash = contractHash ?? "mock_hash";
      this.codeId = contractCodeId ?? 0;
      this.contractAddress = contractAddr ?? "mock_address";
    } else {
      this.checkpointData = {};
    }
  }

  async setupClient (): Promise<void> {
    this.client = getClient(this.env.network);
  }

  async deploy (
    account: Account | UserAccount,
    customFees?: TxnStdFee,
    source?: string,
    builder?: string
  ): Promise<DeployInfo> {
    const accountVal: Account =
      (account as UserAccount).account !== undefined
        ? (account as UserAccount).account
        : (account as Account);
    const info = this.checkpointData[this.env.network.name]?.deployInfo;
    if (info) {
      console.log("Warning: contract already deployed, using checkpoints");
      return info;
    }
    await compress(this.contractName);

    const wasmFileContent: Buffer = fs.readFileSync(this.contractPath);

    const inGasLimit = parseInt(customFees?.gas as string);
    const inGasPrice =
      parseFloat(customFees?.amount[0].amount as string) /
      parseFloat(customFees?.gas as string);

    const signingClient = getSigningClient(this.env.network, accountVal);
    const uploadReceipt = await signingClient.tx.compute.storeCode(
      {
        sender: accountVal.address,
        wasm_byte_code: wasmFileContent,
        source: source ?? "",
        builder: builder ?? ""
      },
      {
        gasLimit: Number.isNaN(inGasLimit) ? undefined : inGasLimit,
        gasPriceInFeeDenom: Number.isNaN(inGasPrice) ? undefined : inGasPrice
      }
    );
    const res = uploadReceipt?.arrayLog?.find(
      (log) => log.type === "message" && log.key === "code_id"
    );
    if (res === undefined) {
      throw new PolarError(ERRORS.GENERAL.STORE_RESPONSE_NOT_RECEIVED, {
        jsonLog: JSON.stringify(uploadReceipt, null, 2),
        contractName: this.contractName
      });
    }
    const codeId = Number(res.value);

    const contractCodeHash = await signingClient.query.compute.codeHashByCodeId({
      code_id: codeId.toString()
    });
    this.codeId = codeId;
    const deployInfo: DeployInfo = {
      codeId: codeId,
      contractCodeHash: contractCodeHash.code_hash as string,
      deployTimestamp: String(new Date())
    };

    if (this.env.runtimeArgs.useCheckpoints === true) {
      this.checkpointData[this.env.network.name] = {
        ...this.checkpointData[this.env.network.name],
        deployInfo
      };
      persistCheckpoint(this.checkpointPath, this.checkpointData);
    }
    this.contractCodeHash = contractCodeHash.code_hash as string;

    return deployInfo;
  }

  instantiatedWithAddress (
    address: string,
    timestamp?: Date | undefined
  ): void {
    const initTimestamp = timestamp !== undefined ? String(timestamp) : String(new Date());

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
      instantiateTag: this.instantiateTag,
      contractAddress: address,
      instantiateTimestamp: initTimestamp
    };
    // set init data (contract address, init timestamp) in checkpoints
    const instInfo = this.checkpointData[this.env.network.name].instantiateInfo;
    if (instInfo) {
      this.checkpointData[this.env.network.name].instantiateInfo?.push(instantiateInfo);
    } else {
      this.checkpointData[this.env.network.name].instantiateInfo = [instantiateInfo];
    }
    persistCheckpoint(this.checkpointPath, this.checkpointData);
  }

  async instantiate (
    initArgs: Record<string, unknown>,
    label: string,
    account: Account | UserAccount,
    transferAmount?: Coin[],
    customFees?: TxnStdFee
  ): Promise<InstantiateInfo> {
    const accountVal: Account =
      (account as UserAccount).account !== undefined
        ? (account as UserAccount).account
        : (account as Account);
    if (this.contractCodeHash === "mock_hash") {
      throw new PolarError(ERRORS.GENERAL.CONTRACT_NOT_DEPLOYED, {
        param: this.contractName
      });
    }
    let info;
    // Load instantiate info for tag
    for (const value of this.checkpointData[this.env.network.name].instantiateInfo ?? []) {
      if (value.instantiateTag === this.instantiateTag) {
        info = value;
      }
    }
    if (info) {
      console.log("Warning: contract already instantiated, using checkpoints");
      return info;
    }
    const signingClient = getSigningClient(this.env.network, accountVal);

    const inGasLimit = parseInt(customFees?.gas as string);
    const inGasPrice =
      parseFloat(customFees?.amount[0].amount as string) /
      parseFloat(customFees?.gas as string);

    const initTimestamp = String(new Date());
    label =
      this.env.runtimeArgs.command === "test"
        ? `deploy ${this.contractName} ${initTimestamp}`
        : label;
    console.log(`Instantiating with label: ${label}`);

    const tx = await signingClient.tx.compute.instantiateContract(
      {
        code_id: this.codeId,
        sender: accountVal.address,
        code_hash: this.contractCodeHash,
        init_msg: initArgs,
        label: label,
        init_funds: transferAmount
      },
      {
        gasLimit: Number.isNaN(inGasLimit) ? undefined : inGasLimit,
        gasPriceInFeeDenom: Number.isNaN(inGasPrice) ? undefined : inGasPrice
      }
    );

    // Find the contract_address in the logs
    const res = tx?.arrayLog?.find(
      (log) => log.type === "message" && log.key === "contract_address"
    );
    if (res === undefined) {
      throw new PolarError(ERRORS.GENERAL.INIT_RESPONSE_NOT_RECEIVED, {
        jsonLog: JSON.stringify(tx, null, 2),
        contractName: this.contractName
      });
    }
    this.contractAddress = res.value;

    const instantiateInfo: InstantiateInfo = {
      instantiateTag: this.instantiateTag,
      contractAddress: this.contractAddress,
      instantiateTimestamp: initTimestamp
    };

    if (this.env.runtimeArgs.useCheckpoints === true) {
      const instInfo = this.checkpointData[this.env.network.name].instantiateInfo;
      if (instInfo) {
        this.checkpointData[this.env.network.name].instantiateInfo?.push(instantiateInfo);
      } else {
        this.checkpointData[this.env.network.name].instantiateInfo = [instantiateInfo];
      }
      persistCheckpoint(this.checkpointPath, this.checkpointData);
    }
    return instantiateInfo;
  }

  async queryMsg (msgData: Record<string, unknown>): Promise<any> { // eslint-disable-line  @typescript-eslint/no-explicit-any
    if (this.contractAddress === "mock_address") {
      throw new PolarError(ERRORS.GENERAL.CONTRACT_NOT_INSTANTIATED, {
        param: this.contractName
      });
    }
    // Query the contract
    console.log("Querying", this.contractAddress, "=>", Object.keys(msgData)[0]);
    console.log(this.contractAddress, msgData);

    if (this.client === undefined) {
      throw new PolarError(ERRORS.GENERAL.CLIENT_NOT_LOADED);
    }
    return await this.client.query.compute.queryContract({
      contract_address: this.contractAddress,
      query: msgData,
      code_hash: this.contractCodeHash
    });
  }

  async executeMsg (
    msgData: Record<string, unknown>,
    account: Account | UserAccount,
    customFees?: TxnStdFee,
    memo?: string,
    transferAmount?: readonly Coin[]
  ): Promise<any> { // eslint-disable-line  @typescript-eslint/no-explicit-any
    const accountVal: Account =
      (account as UserAccount).account !== undefined
        ? (account as UserAccount).account
        : (account as Account);
    if (this.contractAddress === "mock_address") {
      throw new PolarError(ERRORS.GENERAL.CONTRACT_NOT_INSTANTIATED, {
        param: this.contractName
      });
    }
    // Send execute msg to the contract
    const signingClient = getSigningClient(this.env.network, accountVal);

    const inGasLimit = parseInt(customFees?.gas as string);
    const inGasPrice =
      parseFloat(customFees?.amount[0].amount as string) /
      parseFloat(customFees?.gas as string);

    console.log("Executing", this.contractAddress, msgData);
    // Send the same handleMsg to increment multiple times
    const txnResponse = await signingClient.tx.compute.executeContract(
      {
        sender: accountVal.address,
        contract_address: this.contractAddress,
        code_hash: this.contractCodeHash,
        msg: msgData,
        sent_funds: transferAmount as Coin[] | undefined
      },
      {
        gasLimit: Number.isNaN(inGasLimit) ? undefined : inGasLimit,
        gasPriceInFeeDenom: Number.isNaN(inGasPrice) ? undefined : inGasPrice,
        memo: memo
      }
    );

    if (txnResponse.code !== 0) {
      throw new PolarError(ERRORS.INTERACTION.TRANSACTION_FAILURE, {
        contractName: this.contractName,
        transaction: JSON.stringify(msgData, null, 2),
        message: JSON.stringify(txnResponse, null, 2)
      });
    }
    return txnResponse;
  }
}
