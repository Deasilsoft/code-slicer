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

type VueSfcParse = (
  source: string,
  options: { filename: string },
) => {
  descriptor: VueDescriptor;
  errors: unknown[];
};

type ScriptBlockParser = {
  extract: typeof extractImportSpecifiersFromJavaScript;
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

let vueSfcParse: VueSfcParse | undefined;

export function extractVueImportSpecifiers(
  filePath: string,
  sourceCode: string,
): string[] {
  const parse = getVueSfcParse();
  const { descriptor, errors } = parse(sourceCode, {
    filename: filePath,
  });

  if (errors.length > 0) {
    throw new Error(
      `Failed to parse Vue file: ${filePath}\n${errors.map(String).join("\n")}`,
    );
  }

  return collectScriptBlockImportSpecifiers(
    filePath,
    getScriptBlocks(descriptor),
  );
}

function getVueSfcParse(): VueSfcParse {
  if (vueSfcParse) {
    return vueSfcParse;
  }

  try {
    const vueCompilerSfc = require("@vue/compiler-sfc") as {
      parse: VueSfcParse;
    };

    vueSfcParse = vueCompilerSfc.parse;

    return vueSfcParse;
  } catch (error: unknown) {
    const isMissingVueCompiler =
      isNodeErrorWithCode(error, "MODULE_NOT_FOUND") &&
      isErrorMessageContaining(error, "@vue/compiler-sfc");

    if (isMissingVueCompiler) {
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

function collectScriptBlockImportSpecifiers(
  filePath: string,
  scriptBlocks: ScriptBlock[],
): string[] {
  const importSpecifiers = new Set<string>();

  for (const scriptBlock of scriptBlocks) {
    for (const importSpecifier of extractScriptBlockImportSpecifiers(
      filePath,
      scriptBlock.content,
      scriptBlock.lang,
    )) {
      importSpecifiers.add(importSpecifier);
    }
  }

  return [...importSpecifiers];
}

function getScriptBlocks(descriptor: VueDescriptor): ScriptBlock[] {
  return [descriptor.script, descriptor.scriptSetup].filter(
    (scriptBlock): scriptBlock is ScriptBlock => scriptBlock !== null,
  );
}

function isNodeErrorWithCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === code
  );
}

function isErrorMessageContaining(error: unknown, text: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message.includes(text)
  );
}

function extractScriptBlockImportSpecifiers(
  filePath: string,
  sourceCode: string,
  language: string | undefined,
): string[] {
  const languageKey = language ?? "js";
  const parser = SCRIPT_BLOCK_PARSERS[languageKey];

  if (!parser) {
    return [];
  }

  return parser.extract(filePath, sourceCode, parser.scriptKind);
}
