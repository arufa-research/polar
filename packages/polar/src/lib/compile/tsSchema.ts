import generate from "@babel/generator";
import * as t from '@babel/types';
import { pascal } from "case";
import { writeFileSync } from 'fs';
import { sync as mkdirp } from "mkdirp";
import { join } from "path";
import * as w from 'polar-wasm-ast-types';
import { getMessageProperties } from "polar-wasm-ast-types";

import { findAndParseTypes, findExecuteMsg, findQueryMsg } from "./utils";

export async function generateTsSchema (
  name: string,
  schemas: any[], // eslint-disable-line  @typescript-eslint/no-explicit-any
  outPath: string,
  skipSchemaErrors: boolean
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

  if (Object.prototype.hasOwnProperty.call(typeHash, 'Coin')) {
    body.push(
      w.importStmt(['Contract', 'polarTypes'], 'secret-polar')
    );
  } else {
    body.push(
      w.importStmt(['Contract', 'polarTypes', 'Coin'], 'secret-polar')
    );
  }

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

    const queryInterface = await w.createQueryInterface(
      ReadOnlyInstance,
      QueryMsg as any,
      skipSchemaErrors
    ); // eslint-disable-line  @typescript-eslint/no-explicit-any
    body.push(queryInterface);

    const queryClass = await w.createQueryClass(
      QueryClient,
      ReadOnlyInstance,
      "Contract",
      QueryMsg as any,
      skipSchemaErrors
    ); // eslint-disable-line  @typescript-eslint/no-explicit-any
    body.push(queryClass);
  }

  // execute messages
  if (ExecuteMsg) {
    const children = getMessageProperties(ExecuteMsg as any); // eslint-disable-line  @typescript-eslint/no-explicit-any
    if (children.length > 0) {
      Client = pascal(`${name}Contract`);
      Instance = pascal(`${name}Interface`);

      const executeInterface = await w.createExecuteInterface(
        Instance,
        ReadOnlyInstance,
        ExecuteMsg as any, // eslint-disable-line  @typescript-eslint/no-explicit-any
        skipSchemaErrors
      );
      body.push(executeInterface);

      // const executeClass = await w.createExecuteClass(
      //   Client,
      //   Instance,
      //   QueryClient as string,
      //   ExecuteMsg as any, // eslint-disable-line  @typescript-eslint/no-explicit-any
      //   name,
      //   skipSchemaErrors
      // )
      // body.push(executeClass);
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
