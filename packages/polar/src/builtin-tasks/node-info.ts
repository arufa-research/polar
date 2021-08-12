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
  console.log("ChainId:", await client.getChainId());
  console.log("Block height:", await client.getHeight());
  const nodeInfo = await client.restClient.nodeInfo();
  console.log('Node Info: ', nodeInfo);
}
