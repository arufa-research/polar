import * as t from '@babel/types';
import { QueryMsg, ExecuteMsg } from './types';
export declare const identifier: (name: string, typeAnnotation: t.TSTypeAnnotation, optional?: boolean) => t.Identifier;
export declare const getPropertyType: (schema: any, prop: any) => {
    type: any;
    optional: any;
};
export declare const propertySignature: (name: string, typeAnnotation: t.TSTypeAnnotation, optional?: boolean) => {
    type: string;
    key: t.Identifier;
    typeAnnotation: t.TSTypeAnnotation;
    optional: boolean;
};
export declare const createTypedObjectParams: (jsonschema: any, camelize?: boolean) => Promise<t.ObjectPattern>;
export declare const createTypeOrInterface: (Type: string, jsonschema: any) => t.ExportNamedDeclaration;

export declare const createWasmQueryMethod: (jsonschema: any) => Promise<t.ClassProperty>;
export declare const createWasmExecMethod: (jsonschema: any) => Promise<t.ClassProperty>;
export declare const createTypeInterface: (jsonschema: any) => Promise<t.ExportNamedDeclaration>;
export declare const createQueryInterface: (className: string, queryMsg: QueryMsg, skipSchemaErrors: boolean) => Promise<t.ExportNamedDeclaration>;
export declare const createExecuteInterface: (className: string, extendsClassName: string | null, execMsg: ExecuteMsg, skipSchemaErrors: boolean) => Promise<t.ExportNamedDeclaration>;
export declare const createQueryClass: (className: string, implementsClassName: string, extendsClassName: string, queryMsg: QueryMsg, skipSchemaErrors: boolean) => Promise<t.ExportNamedDeclaration>;
export declare const createExecuteClass: (className: string, implementsClassName: string, extendsClassName: string, execMsg: ExecuteMsg, contractName: string, skipSchemaErrors: boolean) => Promise<t.ExportNamedDeclaration>;
export declare const createPropertyFunctionWithObjectParams: (methodName: string, responseType: string, jsonschema: any) => Promise<t.TSPropertySignature>;
export declare const createPropertyFunctionWithObjectParamsForExec: (methodName: string, responseType: string, jsonschema: any) => Promise<t.TSPropertySignature>;
