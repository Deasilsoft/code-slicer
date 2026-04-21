import TypeScript from "typescript";
import { collectImportSpecifiers } from "./import-specifiers.js";

function getTypeScriptScriptKind(filePath: string): TypeScript.ScriptKind {
  return filePath.endsWith(".tsx")
    ? TypeScript.ScriptKind.TSX
    : TypeScript.ScriptKind.TS;
}

export function extractTypeScriptImportSpecifiers(
  filePath: string,
  sourceCode: string,
): string[] {
  const sourceFile = TypeScript.createSourceFile(
    filePath,
    sourceCode,
    TypeScript.ScriptTarget.Latest,
    true,
    getTypeScriptScriptKind(filePath),
  );

  return collectImportSpecifiers(sourceFile);
}
