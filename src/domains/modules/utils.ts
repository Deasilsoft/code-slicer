import NodePath from "node:path";
import TypeScript from "typescript";

const SUPPORTED_EXTENSIONS = [
  ".ts",
  ".tsx",
  ".mts",
  ".cts",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
] as const;

export function getCompilerOptions(): TypeScript.CompilerOptions {
  const configFilePath = TypeScript.findConfigFile(
    process.cwd(),
    TypeScript.sys.fileExists,
    "tsconfig.json",
  );

  if (!configFilePath) {
    return {};
  }

  const configFile = TypeScript.readConfigFile(
    configFilePath,
    TypeScript.sys.readFile,
  );

  if (configFile.error) {
    throw new Error(
      TypeScript.flattenDiagnosticMessageText(
        configFile.error.messageText,
        "\n",
      ),
    );
  }

  const parsedConfig = TypeScript.parseJsonConfigFileContent(
    configFile.config,
    TypeScript.sys,
    NodePath.dirname(configFilePath),
  );

  return parsedConfig.options;
}

export function getScriptKind(filePath: string): TypeScript.ScriptKind {
  switch (NodePath.extname(filePath).toLowerCase()) {
    case ".js":
    case ".mjs":
    case ".cjs":
      return TypeScript.ScriptKind.JS;
    case ".jsx":
      return TypeScript.ScriptKind.JSX;
    case ".tsx":
      return TypeScript.ScriptKind.TSX;
    default:
      return TypeScript.ScriptKind.TS;
  }
}

export function isFileSpecifier(importSpecifier: string): boolean {
  return importSpecifier.startsWith(".") || importSpecifier.startsWith("/");
}

export function getCandidateFilePaths(baseFilePath: string): string[] {
  const candidateFilePaths = new Set<string>();

  candidateFilePaths.add(baseFilePath);

  for (const extension of SUPPORTED_EXTENSIONS) {
    candidateFilePaths.add(`${baseFilePath}${extension}`);
  }

  for (const extension of SUPPORTED_EXTENSIONS) {
    candidateFilePaths.add(NodePath.join(baseFilePath, `index${extension}`));
  }

  return [...candidateFilePaths];
}

export function isInsideNodeModules(filePath: string): boolean {
  return NodePath.normalize(filePath)
    .split(NodePath.sep)
    .includes("node_modules");
}
