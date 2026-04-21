import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import NodePath from "node:path";
import { describe, expect, it } from "vitest";
import { collectDependencyFiles } from "../src/domains/pipeline/index.js";

describe("CJS traversal", () => {
  it("collects a CJS entry that uses dynamic import", async () => {
    const tempDirPath = await mkdtemp(
      NodePath.join(tmpdir(), "code-slicer-cjs-"),
    );

    try {
      const entryFilePath = NodePath.join(tempDirPath, "entry.cjs");
      const dependencyFilePath = NodePath.join(tempDirPath, "dep.cjs");

      await writeFile(
        entryFilePath,
        'import("./dep.cjs");\nmodule.exports = {};\n',
      );
      await writeFile(dependencyFilePath, 'module.exports = { dep: "cjs" };\n');

      const files = await collectDependencyFiles(entryFilePath);

      expect(files.map((file) => NodePath.basename(file.filePath))).toEqual([
        "entry.cjs",
        "dep.cjs",
      ]);
      expect(files[0].sourceCode).toMatch(/import\("\.\/dep\.cjs"\)/);
      expect(files[1].sourceCode).toMatch(/module\.exports = \{ dep: "cjs" }/);
    } finally {
      await rm(tempDirPath, { recursive: true, force: true });
    }
  });
});
