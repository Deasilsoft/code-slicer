import TypeScript from "typescript";
import { collectImportSpecifiers } from "./import-specifiers.js";

export function extractJavaScriptImportSpecifiers(
  filePath: string,
  sourceCode: string,
): string[] {
  return extractImportSpecifiersFromJavaScript(
    filePath,
    sourceCode,
    filePath.endsWith(".jsx")
      ? TypeScript.ScriptKind.JSX
      : TypeScript.ScriptKind.JS,
  );
}

export function extractImportSpecifiersFromJavaScript(
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
