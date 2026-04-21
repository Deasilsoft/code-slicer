import TypeScript from "typescript";
import { collectImportSpecifiers } from "./import-specifiers.js";

function getJavaScriptScriptKind(filePath: string): TypeScript.ScriptKind {
  return filePath.endsWith(".jsx")
    ? TypeScript.ScriptKind.JSX
    : TypeScript.ScriptKind.JS;
}

export function extractJavaScriptImportSpecifiers(
  filePath: string,
  sourceCode: string,
): string[] {
  const sourceFile = TypeScript.createSourceFile(
    filePath,
    sourceCode,
    TypeScript.ScriptTarget.Latest,
    true,
    getJavaScriptScriptKind(filePath),
  );

  return collectImportSpecifiers(sourceFile);
}
