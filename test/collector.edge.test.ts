import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import NodePath from "node:path";
import { describe, expect, it } from "vitest";
import { collectDependencyFiles } from "../src/domains/pipeline/index.js";

describe("collector edge cases", () => {
  it("throws when the entry file does not exist", async () => {
    const tempDirPath = await mkdtemp(
      NodePath.join(tmpdir(), "code-slicer-missing-entry-"),
    );

    try {
      const missingEntryPath = NodePath.join(tempDirPath, "missing-entry.ts");

      await expect(collectDependencyFiles(missingEntryPath)).rejects.toThrow(
        `Entry file not found: ${missingEntryPath}`,
      );
    } finally {
      await rm(tempDirPath, { recursive: true, force: true });
    }
  });

  it("does not recurse forever when files import each other", async () => {
    const tempDirPath = await mkdtemp(
      NodePath.join(tmpdir(), "code-slicer-cycle-"),
    );

    try {
      const aFilePath = NodePath.join(tempDirPath, "a.ts");
      const bFilePath = NodePath.join(tempDirPath, "b.ts");

      await writeFile(aFilePath, 'import "./b";\nexport const a = "a";\n');
      await writeFile(bFilePath, 'import "./a";\nexport const b = "b";\n');

      const files = await collectDependencyFiles(aFilePath);

      expect(files.map((file) => NodePath.basename(file.filePath))).toEqual([
        "a.ts",
        "b.ts",
      ]);
    } finally {
      await rm(tempDirPath, { recursive: true, force: true });
    }
  });
});
