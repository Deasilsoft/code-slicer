import TypeScript from "typescript";
import { getScriptKind } from "./utils.js";

export function extractImportSpecifiers(
  filePath: string,
  sourceCode: string,
): string[] {
  const sourceFile = TypeScript.createSourceFile(
    filePath,
    sourceCode,
    TypeScript.ScriptTarget.Latest,
    true,
    getScriptKind(filePath),
  );

  const importSpecifiers = new Set<string>();

  for (const statement of sourceFile.statements) {
    if (
      TypeScript.isImportDeclaration(statement) &&
      TypeScript.isStringLiteral(statement.moduleSpecifier)
    ) {
      importSpecifiers.add(statement.moduleSpecifier.text);
    }

    if (
      TypeScript.isExportDeclaration(statement) &&
      statement.moduleSpecifier &&
      TypeScript.isStringLiteral(statement.moduleSpecifier)
    ) {
      importSpecifiers.add(statement.moduleSpecifier.text);
    }
  }

  const visitNode = (node: TypeScript.Node): void => {
    if (
      TypeScript.isCallExpression(node) &&
      node.expression.kind === TypeScript.SyntaxKind.ImportKeyword &&
      node.arguments.length === 1 &&
      TypeScript.isStringLiteral(node.arguments[0])
    ) {
      importSpecifiers.add(node.arguments[0].text);
    }

    TypeScript.forEachChild(node, visitNode);
  };

  TypeScript.forEachChild(sourceFile, visitNode);

  return [...importSpecifiers];
}
