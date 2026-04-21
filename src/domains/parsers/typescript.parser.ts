import TypeScript from "typescript";
import { collectImportSpecifiers } from "./import-specifiers.js";

export function extractTypeScriptImportSpecifiers(
  filePath: string,
  sourceCode: string,
): string[] {
  return extractImportSpecifiersFromTypeScript(
    filePath,
    sourceCode,
    filePath.endsWith(".tsx")
      ? TypeScript.ScriptKind.TSX
      : TypeScript.ScriptKind.TS,
  );
}

export function extractImportSpecifiersFromTypeScript(
  filePath: string,
  sourceCode: string,
  scriptKind: TypeScript.ScriptKind,
): string[] {
  const sourceFile = TypeScript.createSourceFile(
    filePath,
    sourceCode,
    TypeScript.ScriptTarget.Latest,
    true,
    scriptKind,
  );

  return collectImportSpecifiers(sourceFile);
}
