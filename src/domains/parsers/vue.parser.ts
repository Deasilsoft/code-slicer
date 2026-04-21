import { parse } from "@vue/compiler-sfc";
import TypeScript from "typescript";
import { extractImportSpecifiersFromJavaScript } from "./javascript.parser.js";
import { extractImportSpecifiersFromTypeScript } from "./typescript.parser.js";

export function extractVueImportSpecifiers(
  filePath: string,
  sourceCode: string,
): string[] {
  const { descriptor, errors } = parse(sourceCode, {
    filename: filePath,
  });

  if (errors.length > 0) {
    throw new Error(
      `Failed to parse Vue file: ${filePath}\n${errors.map(String).join("\n")}`,
    );
  }

  const importSpecifiers = new Set<string>();
  const scriptBlocks = [descriptor.script, descriptor.scriptSetup].filter(
    (block): block is NonNullable<typeof block> => block !== null,
  );

  for (const scriptBlock of scriptBlocks) {
    const scriptImportSpecifiers = extractScriptBlockImportSpecifiers(
      filePath,
      scriptBlock.content,
      scriptBlock.lang,
    );

    for (const importSpecifier of scriptImportSpecifiers) {
      importSpecifiers.add(importSpecifier);
    }
  }

  return [...importSpecifiers];
}

function extractScriptBlockImportSpecifiers(
  filePath: string,
  sourceCode: string,
  language: string | undefined,
): string[] {
  switch (language) {
    case undefined:
    case "js":
      return extractImportSpecifiersFromJavaScript(
        filePath,
        sourceCode,
        TypeScript.ScriptKind.JS,
      );
    case "jsx":
      return extractImportSpecifiersFromJavaScript(
        filePath,
        sourceCode,
        TypeScript.ScriptKind.JSX,
      );
    case "ts":
      return extractImportSpecifiersFromTypeScript(
        filePath,
        sourceCode,
        TypeScript.ScriptKind.TS,
      );
    case "tsx":
      return extractImportSpecifiersFromTypeScript(
        filePath,
        sourceCode,
        TypeScript.ScriptKind.TSX,
      );
    default:
      return [];
  }
}
