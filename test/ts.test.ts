import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import NodePath from "node:path";
import { describe, expect, it } from "vitest";
import { collectFilesFromEntry } from "../src/domains/modules/index.js";

describe("TypeScript traversal", () => {
  it("collects TypeScript dependencies in traversal order", async () => {
    const tempDirPath = await mkdtemp(
      NodePath.join(tmpdir(), "code-slicer-ts-"),
    );

    try {
      const entryFilePath = NodePath.join(tempDirPath, "entry.ts");
      const dependencyFilePath = NodePath.join(tempDirPath, "dep.ts");
      const nestedFilePath = NodePath.join(tempDirPath, "nested.ts");
      const helperDirectoryPath = NodePath.join(tempDirPath, "helper");
      const helperIndexFilePath = NodePath.join(
        helperDirectoryPath,
        "index.ts",
      );

      await mkdir(helperDirectoryPath, { recursive: true });

      await writeFile(
        entryFilePath,
        'import { dep } from "./dep";\nexport { helper } from "./helper";\nconsole.log(dep, helper);\n',
      );
      await writeFile(
        dependencyFilePath,
        'import { nested } from "./nested";\nexport const dep = nested;\n',
      );
      await writeFile(nestedFilePath, 'export const nested = "nested";\n');
      await writeFile(helperIndexFilePath, 'export const helper = "helper";\n');

      const files = await collectFilesFromEntry(entryFilePath);

      expect(
        files.map((file) => NodePath.relative(tempDirPath, file.filePath)),
      ).toEqual([
        "entry.ts",
        "dep.ts",
        "nested.ts",
        NodePath.join("helper", "index.ts"),
      ]);
    } finally {
      await rm(tempDirPath, { recursive: true, force: true });
    }
  });
});
