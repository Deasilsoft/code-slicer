import { extractJavaScriptImportSpecifiers } from "./javascript.parser.js";
import { getParserType } from "./parser-type.js";
import { extractTypeScriptImportSpecifiers } from "./typescript.parser.js";
import { extractVueImportSpecifiers } from "./vue.parser.js";

export function extractImportSpecifiers(
  filePath: string,
  sourceCode: string,
): string[] {
  switch (getParserType(filePath)) {
    case "javascript": {
      return extractJavaScriptImportSpecifiers(filePath, sourceCode);
    }
    case "typescript": {
      return extractTypeScriptImportSpecifiers(filePath, sourceCode);
    }
    case "vue": {
      return extractVueImportSpecifiers(filePath, sourceCode);
    }
    case "unknown": {
      return [];
    }
  }
}
