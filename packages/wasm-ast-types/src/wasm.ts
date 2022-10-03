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

export const createWasmQueryMethod = (jsonschema: any) => {
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
  queryMsg: QueryMsg
) => {
  const propertyNames = getMessageProperties(queryMsg)
    .map((method) => Object.keys(method.properties)?.[0])
    .filter(Boolean);

  const bindings = propertyNames.map(camel).map(bindMethod);

  const methods = getMessageProperties(queryMsg).map((schema) => {
    return createWasmQueryMethod(schema);
  });

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

export const createWasmExecMethod = (jsonschema: any) => {
  const underscoreName = Object.keys(jsonschema.properties)[0];
  const methodName = camel(underscoreName);
  const properties = jsonschema.properties[underscoreName].properties ?? {};
  const obj = createTypedObjectParams(jsonschema.properties[underscoreName]);
  const args = Object.keys(properties).map((prop) => {
    return t.objectProperty(
      t.identifier(prop),
      t.identifier(camel(prop)),
      false,
      prop === camel(prop)
    );
  });

  const constantParams = t.objectPattern([
    t.objectProperty(
      t.identifier('account'),
      t.identifier('account'),
      false,
      true
    ),
    t.objectProperty(
      t.identifier('customFees'),
      t.identifier('customFees'),
      false,
      true
    ),
    t.objectProperty(t.identifier('memo'), t.identifier('memo'), false, true),
    t.objectProperty(
      t.identifier('transferAmount'),
      t.identifier('transferAmount'),
      false,
      true
    )
  ]);
  constantParams.typeAnnotation = t.tsTypeAnnotation(
    t.tsTypeLiteral([
      t.tSPropertySignature(
        t.identifier('account'),
        t.tsTypeAnnotation(
          t.tsTypeReference(t.identifier('polarTypes.UserAccount'))
        )
      ),
      t.tSPropertySignature(
        t.identifier('customFees?'),
        t.tsTypeAnnotation(
          t.tsTypeReference(t.identifier('polarTypes.TxnStdFee'))
        )
      ),
      t.tSPropertySignature(
        t.identifier('memo?'),
        t.tsTypeAnnotation(t.tsStringKeyword())
      ),
      t.tSPropertySignature(
        t.identifier('transferAmount?'),
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
                t.identifier('account'),
                t.identifier('customFees'),
                t.identifier('memo'),
                t.identifier('transferAmount')
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
  contractName: string
) => {
  const propertyNames = getMessageProperties(execMsg)
    .map((method) => Object.keys(method.properties)?.[0])
    .filter(Boolean);

  const bindings = propertyNames.map(camel).map(bindMethod);

  const methods = getMessageProperties(execMsg).map((schema) => {
    return createWasmExecMethod(schema);
  });

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
  execMsg: ExecuteMsg
) => {
  const methods = getMessageProperties(execMsg).map((jsonschema) => {
    const underscoreName = Object.keys(jsonschema.properties)[0];
    const methodName = camel(underscoreName);
    return createPropertyFunctionWithObjectParamsForExec(
      methodName,
      'any',
      jsonschema.properties[underscoreName]
    );
  });

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
) => {
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
) => {
  const obj = createTypedObjectParams(jsonschema);

  const fixedParams = t.objectPattern([
    t.objectProperty(
      t.identifier('account'),
      t.identifier('account'),
      false,
      true
    ),
    t.objectProperty(
      t.identifier('customFees'),
      t.identifier('customFees'),
      false,
      true
    ),
    t.objectProperty(t.identifier('memo'), t.identifier('memo'), false, true),
    t.objectProperty(
      t.identifier('transferAmount'),
      t.identifier('transferAmount'),
      false,
      true
    )
  ]);
  fixedParams.typeAnnotation = t.tsTypeAnnotation(
    t.tsTypeLiteral([
      t.tSPropertySignature(
        t.identifier('account'),
        t.tsTypeAnnotation(
          t.tsTypeReference(t.identifier('polarTypes.UserAccount'))
        )
      ),
      t.tSPropertySignature(
        t.identifier('customFees?'),
        t.tsTypeAnnotation(
          t.tsTypeReference(t.identifier('polarTypes.TxnStdFee'))
        )
      ),
      t.tSPropertySignature(
        t.identifier('memo?'),
        t.tsTypeAnnotation(t.tsStringKeyword())
      ),
      t.tSPropertySignature(
        t.identifier('transferAmount?'),
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

export const createQueryInterface = (className: string, queryMsg: QueryMsg) => {
  const methods = getMessageProperties(queryMsg).map((jsonschema) => {
    const underscoreName = Object.keys(jsonschema.properties)[0];
    const methodName = camel(underscoreName);
    const responseType = `any`;
    return createPropertyFunctionWithObjectParams(
      methodName,
      responseType,
      jsonschema.properties[underscoreName]
    );
  });

  return t.exportNamedDeclaration(
    t.tsInterfaceDeclaration(
      t.identifier(className),
      null,
      [],
      t.tSInterfaceBody([...methods])
    )
  );
};

export const createTypeOrInterface = (Type: string, jsonschema: any) => {
  if (jsonschema.type !== 'object') {
    if (!jsonschema.type) {
      return t.exportNamedDeclaration(
        t.tsTypeAliasDeclaration(
          t.identifier(Type),
          null,
          t.tsTypeReference(t.identifier(jsonschema.title))
        )
      );
    }

    return t.exportNamedDeclaration(
      t.tsTypeAliasDeclaration(
        t.identifier(Type),
        null,
        getType(jsonschema.type)
      )
    );
  }
  const props = Object.keys(jsonschema.properties ?? {}).map((prop) => {
    const { type, optional } = getPropertyType(jsonschema, prop);
    return propertySignature(camel(prop), t.tsTypeAnnotation(type), optional);
  });

  return t.exportNamedDeclaration(
    t.tsInterfaceDeclaration(
      t.identifier(Type),
      null,
      [],
      t.tsInterfaceBody([...props])
    )
  );
};

export const createTypeInterface = (jsonschema: any) => {
  const Type = jsonschema.title;
  return createTypeOrInterface(Type, jsonschema);
};
