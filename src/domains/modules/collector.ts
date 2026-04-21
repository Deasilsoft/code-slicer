import NodePath from "node:path";
import type TypeScript from "typescript";
import { fileExists, readFile } from "../../shared/fs.js";
import { extractImportSpecifiers } from "./extractor.js";
import { resolveImportFilePath } from "./resolver.js";
import type { ModuleFile } from "./types.js";
import { getCompilerOptions } from "./utils.js";

export async function collectFilesFromEntry(
  entryFilePath: string,
): Promise<ModuleFile[]> {
  const absoluteEntryFilePath = NodePath.resolve(entryFilePath);
  const compilerOptions = getCompilerOptions();

  if (!(await fileExists(absoluteEntryFilePath))) {
    throw new Error(`Entry file not found: ${absoluteEntryFilePath}`);
  }

  const collectedFiles: ModuleFile[] = [];
  const visitedFilePaths = new Set<string>();

  await visitFile(
    absoluteEntryFilePath,
    compilerOptions,
    collectedFiles,
    visitedFilePaths,
  );

  return collectedFiles;
}

async function visitFile(
  filePath: string,
  compilerOptions: TypeScript.CompilerOptions,
  collectedFiles: ModuleFile[],
  visitedFilePaths: Set<string>,
): Promise<void> {
  const normalizedFilePath = NodePath.normalize(filePath);

  if (visitedFilePaths.has(normalizedFilePath)) {
    return;
  }

  visitedFilePaths.add(normalizedFilePath);

  const sourceCode = await readFile(normalizedFilePath);

  collectedFiles.push({
    filePath: normalizedFilePath,
    sourceCode,
  });

  const importSpecifiers = extractImportSpecifiers(
    normalizedFilePath,
    sourceCode,
  );

  for (const importSpecifier of importSpecifiers) {
    const resolvedFilePath = await resolveImportFilePath(
      importSpecifier,
      normalizedFilePath,
      compilerOptions,
    );

    if (!resolvedFilePath) {
      continue;
    }

    await visitFile(
      resolvedFilePath,
      compilerOptions,
      collectedFiles,
      visitedFilePaths,
    );
  }
}
