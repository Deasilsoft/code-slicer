import { createRequire } from "node:module";
import TypeScript from "typescript";
import { extractImportSpecifiersFromJavaScript } from "./javascript.parser.js";
import { extractImportSpecifiersFromTypeScript } from "./typescript.parser.js";

const require = createRequire(import.meta.url);

type ScriptBlock = {
  content: string;
  lang?: string;
};

type VueDescriptor = {
  script: ScriptBlock | null;
  scriptSetup: ScriptBlock | null;
};

type VueParse = (
  source: string,
  options: { filename: string },
) => {
  descriptor: VueDescriptor;
  errors: unknown[];
};

type ScriptBlockParser = {
  extract: (
    filePath: string,
    sourceCode: string,
    scriptKind: TypeScript.ScriptKind,
  ) => string[];
  scriptKind: TypeScript.ScriptKind;
};

const SCRIPT_BLOCK_PARSERS: Record<string, ScriptBlockParser> = {
  js: {
    extract: extractImportSpecifiersFromJavaScript,
    scriptKind: TypeScript.ScriptKind.JS,
  },
  jsx: {
    extract: extractImportSpecifiersFromJavaScript,
    scriptKind: TypeScript.ScriptKind.JSX,
  },
  ts: {
    extract: extractImportSpecifiersFromTypeScript,
    scriptKind: TypeScript.ScriptKind.TS,
  },
  tsx: {
    extract: extractImportSpecifiersFromTypeScript,
    scriptKind: TypeScript.ScriptKind.TSX,
  },
};

let vueParse: VueParse | undefined;

export function extractVueImportSpecifiers(
  filePath: string,
  sourceCode: string,
): string[] {
  const parse = getVueParse();
  const { descriptor, errors } = parse(sourceCode, {
    filename: filePath,
  });

  if (errors.length > 0) {
    throw new Error(
      `Failed to parse Vue file: ${filePath}\n${errors.map(String).join("\n")}`,
    );
  }

  const importSpecifiers = new Set<string>();
  const scriptBlocks = [descriptor.script, descriptor.scriptSetup];

  for (const scriptBlock of scriptBlocks) {
    if (!scriptBlock) {
      continue;
    }

    for (const importSpecifier of extractImportsFromScriptBlock(
      filePath,
      scriptBlock,
    )) {
      importSpecifiers.add(importSpecifier);
    }
  }

  return [...importSpecifiers];
}

function getVueParse(): VueParse {
  if (vueParse) {
    return vueParse;
  }

  try {
    const vue = require("@vue/compiler-sfc") as {
      parse: VueParse;
    };

    vueParse = vue.parse;

    return vueParse;
  } catch (error: unknown) {
    if (isMissingVueCompilerError(error)) {
      throw new Error(
        "Vue support requires optional dependency @vue/compiler-sfc. Install it with: npm install @vue/compiler-sfc",
        {
          cause: error,
        },
      );
    }

    throw error;
  }
}

function isMissingVueCompilerError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    (error as Error & { code?: unknown }).code === "MODULE_NOT_FOUND" &&
    /Cannot find module ['"]@vue\/compiler-sfc['"]/.test(error.message)
  );
}

function extractImportsFromScriptBlock(
  filePath: string,
  scriptBlock: ScriptBlock,
): string[] {
  const languageKey = scriptBlock.lang ?? "js";
  const parser = SCRIPT_BLOCK_PARSERS[languageKey];

  if (!parser) {
    return [];
  }

  return parser.extract(filePath, scriptBlock.content, parser.scriptKind);
}
