import NodePath from "node:path";
import TypeScript from "typescript";
import { fileExists } from "../../shared/fs.js";

const SUPPORTED_EXTENSIONS = [
  ".ts",
  ".tsx",
  ".mts",
  ".cts",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".vue",
] as const;

function isFileSpecifier(importSpecifier: string): boolean {
  return importSpecifier.startsWith(".") || importSpecifier.startsWith("/");
}

function getCandidateFilePaths(baseFilePath: string): string[] {
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

function isInsideNodeModules(filePath: string): boolean {
  return NodePath.normalize(filePath)
    .split(NodePath.sep)
    .includes("node_modules");
}

export async function resolveImportFilePath(
  importSpecifier: string,
  fromFilePath: string,
  compilerOptions: TypeScript.CompilerOptions,
): Promise<string | null> {
  const resolvedWithTypeScript =
    TypeScript.resolveModuleName(
      importSpecifier,
      fromFilePath,
      compilerOptions,
      TypeScript.sys,
    ).resolvedModule?.resolvedFileName ?? null;

  if (resolvedWithTypeScript) {
    const normalizedResolvedFilePath = NodePath.normalize(
      resolvedWithTypeScript,
    );

    if (isInsideNodeModules(normalizedResolvedFilePath)) {
      return null;
    }

    return normalizedResolvedFilePath;
  }

  if (!isFileSpecifier(importSpecifier)) {
    return null;
  }

  const baseFilePath = NodePath.resolve(
    NodePath.dirname(fromFilePath),
    importSpecifier,
  );

  for (const candidateFilePath of getCandidateFilePaths(baseFilePath)) {
    if (!(await fileExists(candidateFilePath))) {
      continue;
    }

    const normalizedCandidateFilePath = NodePath.normalize(candidateFilePath);

    if (isInsideNodeModules(normalizedCandidateFilePath)) {
      return null;
    }

    return normalizedCandidateFilePath;
  }

  return null;
}
