import chalk from "chalk";
import { execSync } from "child_process";
import fs from "fs";

import type { NetworkConfig } from "../types";

function sleep (ms: number): any {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Returns quoted text, given starting point of quote
 */
function returnQuotedText (data: string, start: number): string {
  let it = start + 1;
  let res = "";
  while (data[it] !== "\"") {
    res += data[it];
    it++;
  }
  return res;
}

/**
 * Returns Text
 */
function findText (data: string, start: number, findStr: string): string {
  const mn = findStr;
  const M = mn.length;
  const N = data.length;

  /* A loop to slide pat[] one by one */
  for (let i = start; i <= N - M; i++) {
    let j;

    /* For current index i, check for pattern match */
    for (j = 0; j < M; j++) {
      if (data[i + j] !== mn[j]) { break; }
    }

    if (j === M) {
      return returnQuotedText(data, i + j + 2);
    }
  }
  return "";
}

// Setup local network and update config
export async function setupLocalNet (env: NetworkConfig): Promise<void> {
  console.log(chalk.blue("Starting Local Network!"));
  console.log(chalk.blue("*** Fetching network image ***"));
  try {
    execSync(`sudo docker run -d -it --rm \
    -p 26657:26657 -p 26656:26656 -p 1337:1337 \
    --name secretdev enigmampc/secret-network-sw-dev:latest`);

    await sleep(3000);

    // save output
    execSync(`sudo docker logs --timestamps secretdev > logs.json`);

    // parse logs and save accounts in accounts
    const data = fs.readFileSync('logs.json').toString();
    // TODO: Fix constant number passing
    env.accounts = [
      {
        name: 'account_0',
        address: returnQuotedText(data, 3334),
        mnemonic: findText(data, 3324, "mnemonic")
      },
      {
        name: 'account_1',
        address: findText(data, 3703, "address"),
        mnemonic: findText(data, 3703, "mnemonic")
      }
    ];
  } catch (error) {
    await stopLocalNode();
    throw error;
  }
}

/**
 * Stops local network
 */
export async function stopLocalNode (): Promise<void> {
  execSync(`sudo docker stop secretdev`);
}
