import { task } from "../internal/core/config/config-env";
import { getClient } from "../lib/client";
import { PolarRuntimeEnvironment, TaskArguments } from "../types";
import { TASK_NODE_INFO } from "./task-names";

export default function (): void {
  task(TASK_NODE_INFO, "Prints node info and status")
    .setAction(nodeInfo);
}

async function nodeInfo (_taskArgs: TaskArguments, env: PolarRuntimeEnvironment): Promise<void> {
  const client = getClient(env.network);
  console.log("Network:", env.network.name);
  console.log("ChainId:", env.network.config.chainId);
  console.log("Block height:", await client.query.tendermint.getLatestBlock({}));
  const nodeInfo = await client.query.tendermint.getNodeInfo({})
    // eslint-disable-next-line
    .catch((err) => { throw new Error(`Could not fetch node info: ${err}`); });
  console.log('Node Info: ', nodeInfo);
}
