import TypeScript from "typescript";

export function collectImportSpecifiers(
  sourceFile: TypeScript.SourceFile,
): string[] {
  const importSpecifiers = new Set<string>();

  collectStatementImportSpecifiers(sourceFile, importSpecifiers);
  collectDynamicImportSpecifiers(sourceFile, importSpecifiers);

  return [...importSpecifiers];
}

function collectStatementImportSpecifiers(
  sourceFile: TypeScript.SourceFile,
  importSpecifiers: Set<string>,
): void {
  for (const statement of sourceFile.statements) {
    if (isImportDeclaration(statement)) {
      importSpecifiers.add(statement.moduleSpecifier.text);
    }

    if (isExportDeclaration(statement)) {
      importSpecifiers.add(statement.moduleSpecifier.text);
    }
  }
}

function collectDynamicImportSpecifiers(
  node: TypeScript.Node,
  importSpecifiers: Set<string>,
): void {
  if (isDynamicImport(node)) {
    importSpecifiers.add(node.arguments[0].text);
  }

  TypeScript.forEachChild(node, (childNode) =>
    collectDynamicImportSpecifiers(childNode, importSpecifiers),
  );
}

function isImportDeclaration(
  statement: TypeScript.Statement,
): statement is TypeScript.ImportDeclaration & {
  moduleSpecifier: TypeScript.StringLiteral;
} {
  return (
    TypeScript.isImportDeclaration(statement) &&
    TypeScript.isStringLiteral(statement.moduleSpecifier)
  );
}

function isExportDeclaration(
  statement: TypeScript.Statement,
): statement is TypeScript.ExportDeclaration & {
  moduleSpecifier: TypeScript.StringLiteral;
} {
  return (
    TypeScript.isExportDeclaration(statement) &&
    statement.moduleSpecifier !== undefined &&
    TypeScript.isStringLiteral(statement.moduleSpecifier)
  );
}

function isDynamicImport(
  node: TypeScript.Node,
): node is TypeScript.CallExpression & {
  arguments: [TypeScript.StringLiteral];
} {
  return (
    TypeScript.isCallExpression(node) &&
    node.expression.kind === TypeScript.SyntaxKind.ImportKeyword &&
    node.arguments.length === 1 &&
    TypeScript.isStringLiteral(node.arguments[0])
  );
}
