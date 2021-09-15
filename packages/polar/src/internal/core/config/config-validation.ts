import * as z from 'zod';

import type { NetworkConfig } from "../../../types";
import { parseZodError } from "../../util/zod-errors";
import { PolarError } from '../errors';
import { ERRORS } from '../errors-list';
import CfgErrors from "./config-errors";

const AccountType = z.object({
  name: z.string(),
  address: z.string(),
  mnemonic: z.string()
});

const HttpNetworkType = z.object({
  accounts: z.array(AccountType).optional(),
  endpoint: z.string().optional(),
  nodeId: z.string().optional(),
  chainId: z.string().optional(),
  keyringBackend: z.string().optional()
}).nonstrict();

const NetworksType = z.record(HttpNetworkType);

const ProjectPaths = z.object({
  root: z.string().optional(),
  cache: z.string().optional(),
  artifacts: z.string().optional(),
  sources: z.string().optional(),
  tests: z.string().optional()
}).nonstrict();

const Config = z.object({
  networks: NetworksType.optional(),
  paths: ProjectPaths.optional()
}
).nonstrict();

/**
 * Validates the config, throwing a BuilderError if invalid.
 * @param config
 */
export function validateConfig(config: any) { // eslint-disable-line
  const errors = getValidationErrors(config);

  if (errors.isEmpty()) {
    return;
  }

  const errorList = `  * ${errors.toString()}`;
  throw new PolarError(ERRORS.GENERAL.INVALID_CONFIG, { errors: errorList });
}

export function getValidationErrors(config: any): CfgErrors {  // eslint-disable-line
  const errors = new CfgErrors();

  if (config !== undefined && typeof config.networks === "object") {
    for (const [net, ncfg] of Object.entries<NetworkConfig>(config.networks)) {
      const accountsMap = new Map<string, number>(); // {} as ([key: string]: number);
      let j;
      for (let i = 0; i < (ncfg.accounts || []).length; ++i) {
        const a = ncfg.accounts[i];
        const p = errors.putter(net + ".accounts", i.toString());
        if (a.name === undefined) {
          const errorMessage = `Account with index ${i} does not have name specified`;
          p.push('name', errorMessage, 'string');
        }
        if (a.address === undefined) {
          const errorMessage = `Account with index ${i} does not have address specified`;
          p.push('address', errorMessage, 'string');
        }
        if (a.mnemonic === undefined) {
          const errorMessage = `Account with index ${i} does not have mnemonic specified`;
          p.push('mnemonic', errorMessage, 'string');
        }
        if ((j = accountsMap.get(a.name)) !== undefined) {
          // eslint-disable-next-line
          const errorMessage: string = `Account name ${String(a.name)} already exists at index ${String(j)}`;
          p.push('name', errorMessage, 'string');
        } else {
          accountsMap.set(a.name, i);
        }
      }

      try {
        HttpNetworkType.parse(ncfg);
      } catch (e) {
        if (e instanceof z.ZodError) {
          errors.appendErrors([parseZodError(e)]);
        }
      }
    }
  }

  if (!errors.isEmpty()) {
    return errors;
  }

  try {
    Config.parse(config);
  } catch (e) {
    if (e instanceof z.ZodError) {
      errors.appendErrors([parseZodError(e)]);
    }
  }
  return errors;
}

// Reference: https://stackoverflow.com/questions/5717093
const exp = new RegExp('^(https?:\\/\\/)?' + // protocol
  '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
  '(localhost)|' + // localhost
  '((\\d{1,3}\\.){3}\\d{1,3}))'); // OR ip (v4) address
