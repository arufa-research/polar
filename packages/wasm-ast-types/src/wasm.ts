import * as t from '@babel/types';
import { camel, pascal } from 'case';

import { ExecuteMsg, QueryMsg } from './types';
import {
  arrowFunctionExpression,
  bindMethod,
  classDeclaration,
  classProperty,
  getMessageProperties,
  promiseTypeAnnotation,
  typedIdentifier
} from './utils';
import { identifier, propertySignature, tsTypeOperator } from './utils/babel';
import { createTypedObjectParams } from './utils/types';

export const createWasmQueryMethod = async (
  jsonschema: any,
  definitions: any
): Promise<t.ObjectProperty | t.ClassProperty> => {
  const underscoreName = Object.keys(jsonschema.properties)[0];
  const methodName = camel(underscoreName);
  const responseType = `any`;
  const properties = jsonschema.properties[underscoreName].properties ?? {};

  const obj = await createTypedObjectParams(
    jsonschema.properties[underscoreName],
    definitions
  );
  const args = Object.keys(properties).map((prop) => {
    return t.objectProperty(
      t.identifier(prop),
      t.identifier(camel(prop)),
      false,
      true
    );
  });

  const actionArg = t.objectProperty(
    t.identifier(underscoreName),
    t.objectExpression(args)
  );

  return t.classProperty(
    t.identifier(methodName),
    arrowFunctionExpression(
      obj ? [obj] : [],
      t.blockStatement([
        t.returnStatement(
          t.callExpression(
            t.memberExpression(t.thisExpression(), t.identifier('queryMsg')),
            [t.objectExpression([actionArg])]
          )
        )
      ]),
      t.tsTypeAnnotation(
        t.tsTypeReference(
          t.identifier('Promise'),
          t.tsTypeParameterInstantiation([
            t.tSTypeReference(t.identifier(responseType))
          ])
        )
      ),
      true
    )
  );
};

export const createWasmExecMethod = async (
  jsonschema: any,
  definitions: any
): Promise<t.ClassProperty> => {
  const underscoreName = Object.keys(jsonschema.properties)[0];
  const methodName = camel(underscoreName);
  const properties = jsonschema.properties[underscoreName].properties ?? {};
  const obj = await createTypedObjectParams(
    jsonschema.properties[underscoreName],
    definitions
  );

  let changeConstParamNames = false;
  for (const prop of Object.keys(properties)) {
    if (
      prop === 'memo' ||
      prop === 'account' ||
      prop === 'customFees' ||
      prop === 'transferAmount'
    ) {
      changeConstParamNames = true;
    }
  }

  const args = Object.keys(properties).map((prop) => {
    return t.objectProperty(
      t.identifier(prop),
      t.identifier(camel(prop)),
      false,
      prop === camel(prop)
    );
  });

  const accountVar = changeConstParamNames ? 'txnAccount' : 'account';
  const customFeesVar = changeConstParamNames ? 'txnCustomFees' : 'customFees';
  const memoVar = changeConstParamNames ? 'txnMemo' : 'memo';
  const transferAmountVar = changeConstParamNames
    ? 'txnTransferAmount'
    : 'transferAmount';

  const constantParams = t.objectPattern([
    t.objectProperty(
      t.identifier(accountVar),
      t.identifier(accountVar),
      false,
      true
    ),
    t.objectProperty(
      t.identifier(customFeesVar),
      t.identifier(customFeesVar),
      false,
      true
    ),
    t.objectProperty(t.identifier(memoVar), t.identifier(memoVar), false, true),
    t.objectProperty(
      t.identifier(transferAmountVar),
      t.identifier(transferAmountVar),
      false,
      true
    )
  ]);
  constantParams.typeAnnotation = t.tsTypeAnnotation(
    t.tsTypeLiteral([
      t.tSPropertySignature(
        t.identifier(accountVar),
        t.tsTypeAnnotation(
          t.tsTypeReference(t.identifier('polarTypes.UserAccount'))
        )
      ),
      t.tSPropertySignature(
        t.identifier(`${customFeesVar}?`),
        t.tsTypeAnnotation(
          t.tsTypeReference(t.identifier('polarTypes.TxnStdFee'))
        )
      ),
      t.tSPropertySignature(
        t.identifier(`${memoVar}?`),
        t.tsTypeAnnotation(t.tsStringKeyword())
      ),
      t.tSPropertySignature(
        t.identifier(`${transferAmountVar}?`),
        t.tsTypeAnnotation(
          tsTypeOperator(
            t.tsArrayType(t.tsTypeReference(t.identifier('Coin'))),
            'readonly'
          )
        )
      )
    ])
  );

  return t.classProperty(
    t.identifier(methodName),
    arrowFunctionExpression(
      obj
        ? [
            // props
            constantParams,
            obj
          ]
        : [constantParams],
      t.blockStatement([
        t.returnStatement(
          t.awaitExpression(
            t.callExpression(
              t.memberExpression(
                t.thisExpression(),
                t.identifier('executeMsg')
              ),
              [
                t.objectExpression([
                  t.objectProperty(
                    t.identifier(underscoreName),
                    t.objectExpression([...args])
                  )
                ]),
                t.identifier(accountVar),
                t.identifier(customFeesVar),
                t.identifier(memoVar),
                t.identifier(transferAmountVar)
              ]
            )
          )
        )
      ]),
      // return type
      t.tsTypeAnnotation(
        t.tsTypeReference(
          t.identifier('Promise'),
          t.tsTypeParameterInstantiation([
            t.tSTypeReference(t.identifier('any'))
          ])
        )
      ),
      true
    )
  );
};

export const createQueryClass = async (
  className: string,
  implementsClassName: string,
  extendsClassName: string,
  queryMsg: QueryMsg,
  skipSchemaErrors: boolean
): Promise<t.ExportNamedDeclaration> => {
  const propertyNames = getMessageProperties(queryMsg)
    .map((method) => Object.keys(method.properties)?.[0])
    .filter(Boolean);

  const bindings = propertyNames.map(camel).map(bindMethod);

  const methods = await Promise.all(
    getMessageProperties(queryMsg)
      .map(async (schema) => {
        try {
          return await createWasmQueryMethod(schema, queryMsg.definitions);
        } catch (e) {
          if (skipSchemaErrors) {
            return null;
          } else {
            throw e;
          }
        }
      })
      .filter((method) => method !== null)
  );

  return t.exportNamedDeclaration(
    classDeclaration(
      className,
      [
        // constructor
        t.classMethod(
          'constructor',
          t.identifier('constructor'),
          [
            typedIdentifier(
              'contractName',
              t.tsTypeAnnotation(t.tsStringKeyword())
            ),
            typedIdentifier(
              'instantiateTag?',
              t.tsTypeAnnotation(t.tsStringKeyword())
            )
          ],
          t.blockStatement([
            t.expressionStatement(
              t.callExpression(t.super(), [
                t.identifier('contractName'),
                t.identifier('instantiateTag')
              ])
            ),
            ...bindings
          ])
        ),
        ...methods
      ],
      [t.tSExpressionWithTypeArguments(t.identifier(implementsClassName))],
      extendsClassName ? t.identifier(extendsClassName) : null
    )
  );
};

export const createExecuteClass = async (
  className: string,
  implementsClassName: string,
  extendsClassName: string,
  execMsg: ExecuteMsg,
  contractName: string,
  skipSchemaErrors: boolean
): Promise<t.ExportNamedDeclaration> => {
  const propertyNames = getMessageProperties(execMsg)
    .map((method) => Object.keys(method.properties)?.[0])
    .filter(Boolean);

  const bindings = propertyNames.map(camel).map(bindMethod);

  const methods = await Promise.all(
    getMessageProperties(execMsg)
      .map(async (schema) => {
        try {
          return await createWasmExecMethod(schema, execMsg.definitions);
        } catch (e) {
          if (skipSchemaErrors) {
            return null;
          } else {
            throw e;
          }
        }
      })
      .filter((method) => method !== null)
  );

  const blockStmt = [];

  if (extendsClassName) {
    blockStmt.push(
      t.expressionStatement(
        t.callExpression(t.super(), [
          t.stringLiteral(contractName),
          t.identifier('instantiateTag')
        ])
      )
    );
  }

  [].push.apply(blockStmt, [...bindings]);

  return t.exportNamedDeclaration(
    classDeclaration(
      className,
      [
        // constructor
        t.classMethod(
          'constructor',
          t.identifier('constructor'),
          [
            typedIdentifier(
              'instantiateTag?',
              t.tsTypeAnnotation(t.tsStringKeyword())
            )
          ],
          t.blockStatement(blockStmt)
        ),
        ...methods
      ],
      [t.tSExpressionWithTypeArguments(t.identifier(implementsClassName))],
      extendsClassName ? t.identifier(extendsClassName) : null
    )
  );
};

export const createQueryInterface = async (
  className: string,
  queryMsg: QueryMsg,
  skipSchemaErrors: boolean
): Promise<t.ExportNamedDeclaration> => {
  const methods = await Promise.all(
    getMessageProperties(queryMsg)
      .map(async (jsonschema) => {
        const underscoreName = Object.keys(jsonschema.properties)[0];
        const methodName = camel(underscoreName);
        const responseType = `any`;
        try {
          return await createPropertyFunctionWithObjectParams(
            methodName,
            responseType,
            jsonschema.properties[underscoreName],
            queryMsg.definitions
          );
        } catch (e) {
          if (skipSchemaErrors) {
            return null;
          } else {
            throw e;
          }
        }
      })
      .filter((method) => method !== null)
  );

  return t.exportNamedDeclaration(
    t.tsInterfaceDeclaration(
      t.identifier(className),
      null,
      [],
      t.tSInterfaceBody([...methods])
    )
  );
};

export const createExecuteInterface = async (
  className: string,
  extendsClassName: string | null,
  execMsg: ExecuteMsg,
  skipSchemaErrors: boolean
): Promise<t.ExportNamedDeclaration> => {
  const methods = await Promise.all(
    getMessageProperties(execMsg)
      .map(async (jsonschema) => {
        const underscoreName = Object.keys(jsonschema.properties)[0];
        const methodName = camel(underscoreName);
        try {
          return await createPropertyFunctionWithObjectParamsForExec(
            methodName,
            'any',
            jsonschema.properties[underscoreName],
            execMsg.definitions
          );
        } catch (e) {
          if (skipSchemaErrors) {
            return null;
          } else {
            throw e;
          }
        }
      })
      .filter((method) => method !== null)
  );

  const extendsAst = extendsClassName
    ? [t.tSExpressionWithTypeArguments(t.identifier(extendsClassName))]
    : [];

  return t.exportNamedDeclaration(
    t.tsInterfaceDeclaration(
      t.identifier(className),
      null,
      extendsAst,
      t.tSInterfaceBody([...methods])
    )
  );
};

export const createPropertyFunctionWithObjectParams = async (
  methodName: string,
  responseType: string,
  jsonschema: any,
  definitions: any
): Promise<t.TSPropertySignature> => {
  const obj = await createTypedObjectParams(jsonschema, definitions);

  const func = {
    type: 'TSFunctionType',
    typeAnnotation: promiseTypeAnnotation(responseType),
    parameters: obj ? [obj] : []
  };

  return t.tSPropertySignature(
    t.identifier(methodName),
    t.tsTypeAnnotation(func)
  );
};

export const createPropertyFunctionWithObjectParamsForExec = async (
  methodName: string,
  responseType: string,
  jsonschema: any,
  definitions: any
): Promise<t.TSPropertySignature> => {
  const obj = await createTypedObjectParams(jsonschema, definitions);
  const properties = jsonschema.properties ?? {};

  let changeConstParamNames = false;
  for (const prop of Object.keys(properties)) {
    if (
      prop === 'memo' ||
      prop === 'account' ||
      prop === 'customFees' ||
      prop === 'transferAmount'
    ) {
      changeConstParamNames = true;
    }
  }

  const accountVar = changeConstParamNames ? 'txnAccount' : 'account';
  const customFeesVar = changeConstParamNames ? 'txnCustomFees' : 'customFees';
  const memoVar = changeConstParamNames ? 'txnMemo' : 'memo';
  const transferAmountVar = changeConstParamNames
    ? 'txnTransferAmount'
    : 'transferAmount';

  const fixedParams = t.objectPattern([
    t.objectProperty(
      t.identifier(accountVar),
      t.identifier(accountVar),
      false,
      true
    ),
    t.objectProperty(
      t.identifier(customFeesVar),
      t.identifier(customFeesVar),
      false,
      true
    ),
    t.objectProperty(t.identifier(memoVar), t.identifier(memoVar), false, true),
    t.objectProperty(
      t.identifier(transferAmountVar),
      t.identifier(transferAmountVar),
      false,
      true
    )
  ]);
  fixedParams.typeAnnotation = t.tsTypeAnnotation(
    t.tsTypeLiteral([
      t.tSPropertySignature(
        t.identifier(accountVar),
        t.tsTypeAnnotation(
          t.tsTypeReference(t.identifier('polarTypes.UserAccount'))
        )
      ),
      t.tSPropertySignature(
        t.identifier(`${customFeesVar}?`),
        t.tsTypeAnnotation(
          t.tsTypeReference(t.identifier('polarTypes.TxnStdFee'))
        )
      ),
      t.tSPropertySignature(
        t.identifier(`${memoVar}?`),
        t.tsTypeAnnotation(t.tsStringKeyword())
      ),
      t.tSPropertySignature(
        t.identifier(`${transferAmountVar}?`),
        t.tsTypeAnnotation(
          tsTypeOperator(
            t.tsArrayType(t.tsTypeReference(t.identifier('Coin'))),
            'readonly'
          )
        )
      )
    ])
  );
  const func = {
    type: 'TSFunctionType',
    typeAnnotation: promiseTypeAnnotation(responseType),
    parameters: obj ? [fixedParams, obj] : [fixedParams]
  };

  return t.tSPropertySignature(
    t.identifier(methodName),
    t.tsTypeAnnotation(func)
  );
};
