import generate from "@babel/generator";
import * as t from '@babel/types';
import { pascal } from "case";
import { writeFileSync } from 'fs';
import * as w from 'junokit-wasm-ast-types';
import { getMessageProperties } from "junokit-wasm-ast-types";
import { sync as mkdirp } from "mkdirp";
import { join } from "path";

import { findAndParseTypes, findExecuteMsg, findQueryMsg } from "./utils";

export async function generateTsSchema (
  name: string,
  schemas: any[], // eslint-disable-line  @typescript-eslint/no-explicit-any
  outPath: string
): Promise<void> {
  const Contract = pascal(name) + 'Contract.ts';

  const QueryMsg = findQueryMsg(schemas);
  const ExecuteMsg = findExecuteMsg(schemas);
  const typeHash = await findAndParseTypes(schemas);

  let Client = null;
  let Instance = null;
  let QueryClient = null;
  let ReadOnlyInstance = null;

  const body = [];
  body.push(
    w.importStmt(['ExecuteResult'], '@cosmjs/cosmwasm-stargate')
  );

  body.push(
    w.importStmt(['Contract', 'junokitTypes'], 'junokit')
  );

  body.push(
    w.importStmt(['Coin', 'StdFee'], '@cosmjs/amino')
  );

  // TYPES
  Object.values(typeHash).forEach(type => {
    body.push(
      clean(type as Record<string, unknown>)
    );
  });

  // query messages
  if (QueryMsg) {
    QueryClient = pascal(`${name}QueryContract`);
    ReadOnlyInstance = pascal(`${name}ReadOnlyInterface`);

    body.push(
      w.createQueryInterface(ReadOnlyInstance, QueryMsg as any) // eslint-disable-line  @typescript-eslint/no-explicit-any
    );
    body.push(
      w.createQueryClass(QueryClient, ReadOnlyInstance, "Contract", QueryMsg as any) // eslint-disable-line  @typescript-eslint/no-explicit-any
    );
  }

  // execute messages
  if (ExecuteMsg) {
    const children = getMessageProperties(ExecuteMsg as any); // eslint-disable-line  @typescript-eslint/no-explicit-any
    if (children.length > 0) {
      Client = pascal(`${name}Contract`);
      Instance = pascal(`${name}Interface`);

      body.push(
        w.createExecuteInterface(
          Instance,
          ReadOnlyInstance,
          ExecuteMsg as any // eslint-disable-line  @typescript-eslint/no-explicit-any
        )
      );
      body.push(
        w.createExecuteClass(
          Client,
          Instance,
          QueryClient as string,
          ExecuteMsg as any, // eslint-disable-line  @typescript-eslint/no-explicit-any
          name
        )
      );
    }
  }

  const code = generate(
    t.program(body)
  ).code;

  mkdirp(outPath);
  writeFileSync(join(outPath, Contract), code);
}

export const clean = (
  obj: Record<string, unknown> // eslint-disable-line  @typescript-eslint/no-explicit-any
): any => { // eslint-disable-line  @typescript-eslint/no-explicit-any
  let copy;
  // Handle the 3 simple types, and null or undefined
  if (obj == null || typeof obj !== 'object') return obj;

  // Handle Date
  if (obj instanceof Date) {
    copy = new Date();
    copy.setTime(obj.getTime());
    return copy;
  }

  // Handle Array
  if (obj instanceof Array) {
    copy = [];
    for (let i = 0, len = obj.length; i < len; i++) {
      copy[i] = clean(obj[i]);
    }
    return copy;
  }

  // Handle Object
  if (obj instanceof Object || typeof obj === 'object') {
    copy = {} as { [key: string]: any }; // eslint-disable-line  @typescript-eslint/no-explicit-any
    for (const attr in obj) {
      switch (attr) {
        case 'leadingComments':
        case 'trailingComments':
        case 'loc':
        case 'start':
        case 'end':
          break;
        default:
          copy[attr] = clean(obj[attr] as Record<string, unknown>);
      }
    }
    return copy;
  }

  throw new Error("Unable to copy obj! Its type isn't supported.");
};
