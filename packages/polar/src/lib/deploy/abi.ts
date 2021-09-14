import { ExecuteMsgNode, ParseNode, ParseSchema, parseSchema, rustRepr } from "parse-cosmwasm-schema";

import type { AnyJson } from '../../types';

// TODO: add types here when rust types parsing is added later
export interface AbiParam {
  name: string
  type: any
}

export interface AbiMessage {
  args: AbiParam[]
  docs?: string[]
  identifier: string
  isConstructor?: boolean
  returnType?: any
}

export class Abi {
  public readonly json: AnyJson;
  public messages: AbiMessage[];

  constructor (abiJson: AnyJson) {
    this.json = abiJson;
    this.messages = [];
  }

  async parseSchema (): Promise<void> {
    const parseExecuteMsg = async (schema: ParseSchema): Promise<AbiMessage[]> => {
      const tree: ExecuteMsgNode = await parseSchema(schema) as ExecuteMsgNode;

      const messages: AbiMessage[] = [];
      tree.value.variants.forEach((variant) => {
        Object.entries(variant.value.members).forEach(([fnName, fnBody]) => {
          const msgArgs: AbiParam[] = [];
          Object.entries(fnBody.value.members).forEach(([argName, argBody]) => {
            const msgArg: AbiParam = {
              name: argName,
              type: rustReprAlt(argBody)
            };
            msgArgs.push(msgArg);
          });

          const message: AbiMessage = {
            args: msgArgs,
            identifier: fnName
          };
          messages.push(message);
        });
      });

      return messages;
    };

    const rustReprAlt = (node: ParseNode): string => {
      if (node.ref === undefined) {
        return rustRepr({ ...node, ref: undefined });
      }
      return rustRepr(node);
    };

    this.messages = await parseExecuteMsg((this.json as ParseSchema));
  }
}
