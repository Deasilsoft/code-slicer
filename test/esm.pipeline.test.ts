import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import NodePath from "node:path";
import { describe, expect, it } from "vitest";
import { collectDependencyFiles } from "../src/domains/pipeline/index.js";

describe("ESM traversal", () => {
  it("collects an ESM entry and its local dependency", async () => {
    const tempDirPath = await mkdtemp(
      NodePath.join(tmpdir(), "code-slicer-esm-"),
    );

    try {
      const entryFilePath = NodePath.join(tempDirPath, "entry.mjs");
      const dependencyFilePath = NodePath.join(tempDirPath, "dep.js");

      await writeFile(
        entryFilePath,
        'import { dep } from "./dep.js";\nconsole.log(dep);\n',
      );
      await writeFile(dependencyFilePath, 'export const dep = "esm";\n');

      const files = await collectDependencyFiles(entryFilePath);

      expect(files.map((file) => NodePath.basename(file.filePath))).toEqual([
        "entry.mjs",
        "dep.js",
      ]);
      expect(files[0].sourceCode).toMatch(/import \{ dep } from "\.\/dep\.js"/);
      expect(files[1].sourceCode).toMatch(/export const dep = "esm"/);
    } finally {
      await rm(tempDirPath, { recursive: true, force: true });
    }
  });
});
