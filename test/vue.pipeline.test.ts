import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import NodePath from "node:path";
import { describe, expect, it } from "vitest";
import { collectDependencyFiles } from "../src/domains/pipeline/index.js";

describe("Vue file traversal", () => {
  it("skips imports in unsupported Vue files", async () => {
    const tempDirPath = await mkdtemp(
      NodePath.join(tmpdir(), "code-slicer-vue-"),
    );

    try {
      const entryFilePath = NodePath.join(tempDirPath, "entry.vue");
      const dependencyFilePath = NodePath.join(tempDirPath, "dep.ts");

      await writeFile(
        entryFilePath,
        '<script setup lang="ts">\nimport { dep } from "./dep";\nconsole.log(dep);\n</script>\n',
      );
      await writeFile(dependencyFilePath, 'export const dep = "dep";\n');

      const files = await collectDependencyFiles(entryFilePath);

      expect(
        files.map((file) => NodePath.relative(tempDirPath, file.filePath)),
      ).toEqual(["entry.vue"]);
    } finally {
      await rm(tempDirPath, { recursive: true, force: true });
    }
  });
});
