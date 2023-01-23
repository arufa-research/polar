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
import {
  createTypedObjectParams,
  getPropertyType,
  getType
} from './utils/types';

export const createWasmQueryMethod = (
  jsonschema: any,
): t.ObjectProperty | t.ClassProperty => {
  const underscoreName = Object.keys(jsonschema.properties)[0];
  const methodName = camel(underscoreName);
  const responseType = `any`;
  const properties = jsonschema.properties[underscoreName].properties ?? {};

  const obj = createTypedObjectParams(jsonschema.properties[underscoreName]);
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

export const createQueryClass = (
  className: string,
  implementsClassName: string,
  extendsClassName: string,
  queryMsg: QueryMsg,
  skipSchemaErrors: boolean,
): t.ExportNamedDeclaration => {
  const propertyNames = getMessageProperties(queryMsg)
    .map((method) => Object.keys(method.properties)?.[0])
    .filter(Boolean);

  const bindings = propertyNames.map(camel).map(bindMethod);

  const methods = getMessageProperties(queryMsg).map((schema) => {
    try {
      const propFunc = createWasmQueryMethod(schema);
      return propFunc;
    } catch(e) {
      if (skipSchemaErrors) {
        return null;
      } else {
        throw e;
      }
    }
  }).filter((method) => {method !== null && method !== undefined});

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
            )
          ],
          t.blockStatement([
            t.expressionStatement(
              t.callExpression(t.super(), [t.identifier('contractName')])
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

export const createWasmExecMethod = (jsonschema: any): t.ClassProperty => {
  const underscoreName = Object.keys(jsonschema.properties)[0];
  const methodName = camel(underscoreName);
  const properties = jsonschema.properties[underscoreName].properties ?? {};
  const obj = createTypedObjectParams(jsonschema.properties[underscoreName]);

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

export const createExecuteClass = (
  className: string,
  implementsClassName: string,
  extendsClassName: string,
  execMsg: ExecuteMsg,
  contractName: string,
  skipSchemaErrors: boolean,
): t.ExportNamedDeclaration => {
  const propertyNames = getMessageProperties(execMsg)
    .map((method) => Object.keys(method.properties)?.[0])
    .filter(Boolean);

  const bindings = propertyNames.map(camel).map(bindMethod);

  const methods = getMessageProperties(execMsg).map((schema) => {
    try {
      const propFunc = createWasmExecMethod(schema);
      return propFunc;
    } catch(e) {
      if (skipSchemaErrors) {
        return null;
      } else {
        throw e;
      }
    }
  }).filter((method) => {method !== null && method !== undefined});

  const blockStmt = [];

  if (extendsClassName) {
    blockStmt.push(
      // super()
      t.expressionStatement(
        t.callExpression(t.super(), [t.stringLiteral(contractName)])
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
          [],
          t.blockStatement(blockStmt)
        ),
        ...methods
      ],
      [t.tSExpressionWithTypeArguments(t.identifier(implementsClassName))],
      extendsClassName ? t.identifier(extendsClassName) : null
    )
  );
};

export const createExecuteInterface = (
  className: string,
  extendsClassName: string | null,
  execMsg: ExecuteMsg,
  skipSchemaErrors: boolean,
): t.ExportNamedDeclaration => {
  const methods = getMessageProperties(execMsg).map((jsonschema) => {
    const underscoreName = Object.keys(jsonschema.properties)[0];
    const methodName = camel(underscoreName);
    try {
      const propFunc = createPropertyFunctionWithObjectParamsForExec(
        methodName,
        'any',
        jsonschema.properties[underscoreName]
      );
      return propFunc;
    } catch(e) {
      if (skipSchemaErrors) {
        return null;
      } else {
        throw e;
      }
    }
  }).filter((method) => {method !== null && method !== undefined});

  const extendsAst = extendsClassName
    ? [t.tSExpressionWithTypeArguments(t.identifier(extendsClassName))]
    : [];

  return t.exportNamedDeclaration(
    t.tsInterfaceDeclaration(
      t.identifier(className),
      null,
      extendsAst,
      t.tSInterfaceBody([
        // // contract address
        // t.tSPropertySignature(
        //   t.identifier('account'),
        //   t.tsTypeAnnotation(
        //     t.tsStringKeyword()
        //   )
        // ),

        ...methods
      ])
    )
  );
};

export const createPropertyFunctionWithObjectParams = (
  methodName: string,
  responseType: string,
  jsonschema: any
): t.TSPropertySignature => {
  const obj = createTypedObjectParams(jsonschema);

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

export const createPropertyFunctionWithObjectParamsForExec = (
  methodName: string,
  responseType: string,
  jsonschema: any
): t.TSPropertySignature => {
  const obj = createTypedObjectParams(jsonschema);
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

export const createQueryInterface = (
  className: string,
  queryMsg: QueryMsg,
  skipSchemaErrors: boolean,
): t.ExportNamedDeclaration => {
  const methods = getMessageProperties(queryMsg).map((jsonschema) => {
    const underscoreName = Object.keys(jsonschema.properties)[0];
    const methodName = camel(underscoreName);
    const responseType = `any`;
    try {
      const propFunc = createPropertyFunctionWithObjectParams(
        methodName,
        responseType,
        jsonschema.properties[underscoreName]
      );
      return propFunc;
    } catch(e) {
      if (skipSchemaErrors) {
        return null;
      } else {
        throw e;
      }
    }
  }).filter((method) => {method !== null && method !== undefined});

  return t.exportNamedDeclaration(
    t.tsInterfaceDeclaration(
      t.identifier(className),
      null,
      [],
      t.tSInterfaceBody([...methods])
    )
  );
};

