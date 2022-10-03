import { parse, ParserPlugin } from '@babel/parser';
import babelTraverse from '@babel/traverse';

export const parser = (codes: string[]): Record<string, unknown> => {
  const hash: { [key: string]: any } = {}; // eslint-disable-line  @typescript-eslint/no-explicit-any
  codes.forEach(code => {
    const plugins: ParserPlugin[] = [
      'typescript'
    ];

    const ast = parse(code, {
      sourceType: 'module',
      plugins
    });

    const visitor = visitorFn({
      addType (key: string, node: any) { // eslint-disable-line  @typescript-eslint/no-explicit-any
        hash[key] = node;
      }
    });
    babelTraverse(ast, visitor);
  });

  return hash;
};

const visitorFn = (parser: { addType: any }): Record<string, unknown> => ({ // eslint-disable-line  @typescript-eslint/no-explicit-any
  TSTypeAliasDeclaration (path: { node: { id: { name: any } }, parentPath: { node: any } }) { // eslint-disable-line  @typescript-eslint/no-explicit-any
    parser.addType(path.node.id.name, path.parentPath.node);
    // if (path.node.id.name.endsWith('For_Empty')) {
    //     const newName = path.node.id.name.replace(/For_Empty$/, '_for_Empty');
    //     path.parentPath.node.declaration.id.name = newName;
    //     parser.addType(newName, path.parentPath.node);
    // } else {
    //     parser.addType(path.node.id.name, path.parentPath.node);
    // }
  },
  TSInterfaceDeclaration (path: { node: { id: { name: any } }, parentPath: { node: any } }) { // eslint-disable-line  @typescript-eslint/no-explicit-any
    parser.addType(path.node.id.name, path.parentPath.node);
  }
});
