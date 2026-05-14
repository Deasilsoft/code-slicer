import NodePath from "node:path";
import type TypeScript from "typescript";
import { fileExists, readFile } from "../../shared/fs.js";
import { extractImportSpecifiers } from "../parsers/index.js";
import { getCompilerOptions } from "./compiler-options.js";
import { resolveImportFilePath } from "./resolver.js";
import type { CollectionContext, ModuleFile } from "./types.js";

export async function collectDependencyFiles(
  filePath: string,
  projectFilePath?: string,
): Promise<ModuleFile[]> {
  const resolvedFilePath = NodePath.resolve(filePath);

  if (!(await fileExists(resolvedFilePath))) {
    throw new Error(`Entry file not found: ${resolvedFilePath}`);
  }

  const compilerOptions = getCompilerOptions(resolvedFilePath, projectFilePath);

  const context: CollectionContext = {
    compilerOptions,
    files: [],
    visitedFilePaths: new Set<string>(),
  };

  await visitFile(resolvedFilePath, context);

  return context.files;
}

async function visitFile(
  filePath: string,
  context: CollectionContext,
): Promise<void> {
  const normalizedFilePath = NodePath.normalize(filePath);

  if (context.visitedFilePaths.has(normalizedFilePath)) {
    return;
  }

  context.visitedFilePaths.add(normalizedFilePath);

  const sourceCode = await readFile(normalizedFilePath);

  context.files.push({
    filePath: normalizedFilePath,
    sourceCode,
  });

  const dependencyFilePaths = await collectFileDependencies(
    normalizedFilePath,
    sourceCode,
    context.compilerOptions,
  );

  for (const dependencyFilePath of dependencyFilePaths) {
    await visitFile(dependencyFilePath, context);
  }
}

async function collectFileDependencies(
  filePath: string,
  sourceCode: string,
  compilerOptions: TypeScript.CompilerOptions,
): Promise<string[]> {
  const importSpecifiers = extractImportSpecifiers(filePath, sourceCode);

  return resolveImportFilePaths(importSpecifiers, filePath, compilerOptions);
}

async function resolveImportFilePaths(
  importSpecifiers: string[],
  fromFilePath: string,
  compilerOptions: TypeScript.CompilerOptions,
): Promise<string[]> {
  const resolvedFilePaths: string[] = [];

  for (const importSpecifier of importSpecifiers) {
    const resolvedFilePath = await resolveImportFilePath(
      importSpecifier,
      fromFilePath,
      compilerOptions,
    );

    if (!resolvedFilePath) {
      continue;
    }

    resolvedFilePaths.push(resolvedFilePath);
  }

  return resolvedFilePaths;
}
