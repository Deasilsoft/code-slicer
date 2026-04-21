import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import NodePath from "node:path";
import { describe, expect, it } from "vitest";
import { collectFilesFromEntry } from "../src/domains/modules/index.js";

describe("TypeScript traversal with broken imports", () => {
  it("keeps resolvable imports and skips missing or external modules", async () => {
    const tempDirPath = await mkdtemp(
      NodePath.join(tmpdir(), "code-slicer-ts-broken-"),
    );

    try {
      const entryFilePath = NodePath.join(tempDirPath, "entry.ts");
      const presentFilePath = NodePath.join(tempDirPath, "present.ts");

      await writeFile(
        entryFilePath,
        'import { present } from "./present";\nimport "./missing";\nimport "not-installed-package";\nvoid import("./missing-dynamic");\nconsole.log(present);\n',
      );
      await writeFile(presentFilePath, 'export const present = "ok";\n');

      const files = await collectFilesFromEntry(entryFilePath);

      expect(files.map((file) => NodePath.basename(file.filePath))).toEqual([
        "entry.ts",
        "present.ts",
      ]);
      expect(files.some((file) => file.filePath.includes("missing"))).toBe(
        false,
      );
    } finally {
      await rm(tempDirPath, { recursive: true, force: true });
    }
  });
});
