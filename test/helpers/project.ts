import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import NodePath from "node:path";
import type { ModuleFile } from "../../src/domains/pipeline/types.js";

export async function withTestProject(
  files: Record<string, string>,
  run: (projectPath: string) => Promise<void>,
): Promise<void> {
  const projectPath = await mkdtemp(
    NodePath.join(tmpdir(), "code-slicer-test-"),
  );

  try {
    for (const [relativeFilePath, sourceCode] of Object.entries(files)) {
      const filePath = NodePath.join(projectPath, relativeFilePath);

      await mkdir(NodePath.dirname(filePath), { recursive: true });
      await writeFile(filePath, sourceCode);
    }

    await run(projectPath);
  } finally {
    await rm(projectPath, { recursive: true, force: true });
  }
}

export function getProjectFilePath(
  projectPath: string,
  relativeFilePath: string,
): string {
  return NodePath.join(projectPath, relativeFilePath);
}

export function getRelativeFilePaths(
  projectPath: string,
  files: ModuleFile[],
): string[] {
  return files.map((file) => NodePath.relative(projectPath, file.filePath));
}
