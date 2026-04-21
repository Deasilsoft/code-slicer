import NodePath from "node:path";
import TypeScript from "typescript";
import { fileExists } from "../../shared/fs.js";
import {
  getCandidateFilePaths,
  isFileSpecifier,
  isInsideNodeModules,
} from "./utils.js";

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
