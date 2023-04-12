import { parse } from '@babel/parser';
import * as t from '@babel/types';
import { camel } from 'case';
import { compile } from 'polar-json-to-ts';

import { propertySignature } from './babel';

export const createTypedObjectParams = async (
  jsonschema: any,
  definitions: any,
  camelize: boolean = true
): Promise<t.ObjectPattern> => {
  const keys = Object.keys(jsonschema.properties ?? {});
  if (!keys.length) return;

  jsonschema.definitions = definitions;
  const typedParams: any[] = [];

  // use json-to-ts generated type here
  const testHash = await compile(jsonschema, 'testParamName', {
    additionalProperties: false,
    bannerComment: '',
    declareExternallyReferenced: true
  });

  const testAST = parse(testHash, {
    allowImportExportEverywhere: true,
    plugins: ['typescript']
  });

  const declarationAST = testAST.program.body as t.ExportNamedDeclaration[];
  const interfaceAST = declarationAST.find(
    (interfaceCurrent) =>
      (interfaceCurrent.declaration as t.TSInterfaceDeclaration).id.name ===
      'testParamName'
  ).declaration as t.TSInterfaceDeclaration;
  // asset if declaration is there
  // declarationAST.type = "ExportNamedDeclaration"
  // const interfaceAST = declarationAST.declaration as t.TSInterfaceDeclaration;

  const paramsAST = interfaceAST.body.body as t.TSPropertySignature[];

  for (const paramAST of paramsAST) {
    const paramName = (paramAST.key as t.Identifier).name;
    const paramType = paramAST.typeAnnotation;

    typedParams.push(
      propertySignature(
        camelize ? camel(paramName) : paramName,
        paramType,
        false // check for optional later: TODO
      )
    );
  }

  const params = keys.map((prop) => {
    return t.objectProperty(
      camelize ? t.identifier(camel(prop)) : t.identifier(prop),
      camelize ? t.identifier(camel(prop)) : t.identifier(prop),
      false,
      true
    );
  });

  const obj = t.objectPattern([...params]);
  obj.typeAnnotation = t.tsTypeAnnotation(t.tsTypeLiteral([...typedParams]));

  return obj;
};
