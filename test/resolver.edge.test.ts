import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import NodePath from "node:path";
import TypeScript from "typescript";
import { describe, expect, it } from "vitest";
import { resolveImportFilePath } from "../src/domains/pipeline/resolver.js";

const compilerOptions: TypeScript.CompilerOptions = {
  module: TypeScript.ModuleKind.NodeNext,
  moduleResolution: TypeScript.ModuleResolutionKind.NodeNext,
};

describe("resolver edge cases", () => {
  it("drops imports resolved to node_modules", async () => {
    const tempDirPath = await mkdtemp(
      NodePath.join(tmpdir(), "code-slicer-resolver-node-modules-"),
    );

    try {
      const fromFilePath = NodePath.join(tempDirPath, "entry.ts");
      const packageJsonPath = NodePath.join(
        tempDirPath,
        "node_modules",
        "example-pkg",
        "package.json",
      );
      const indexFilePath = NodePath.join(
        tempDirPath,
        "node_modules",
        "example-pkg",
        "index.js",
      );

      await mkdir(NodePath.dirname(packageJsonPath), { recursive: true });
      await writeFile(fromFilePath, 'import "example-pkg";\n');
      await writeFile(
        packageJsonPath,
        '{"name":"example-pkg","type":"module","exports":"./index.js"}\n',
      );
      await writeFile(indexFilePath, 'export const value = "external";\n');

      const resolvedPath = await resolveImportFilePath(
        "example-pkg",
        fromFilePath,
        compilerOptions,
      );

      expect(resolvedPath).toBeNull();
    } finally {
      await rm(tempDirPath, { recursive: true, force: true });
    }
  });

  it("falls back to candidate file search when TypeScript resolution misses", async () => {
    const tempDirPath = await mkdtemp(
      NodePath.join(tmpdir(), "code-slicer-resolver-fallback-"),
    );

    try {
      const fromFilePath = NodePath.join(tempDirPath, "entry.ts");
      const depFilePath = NodePath.join(tempDirPath, "dep.cjs");

      await writeFile(fromFilePath, 'import "./dep";\n');
      await writeFile(depFilePath, 'module.exports = { dep: "dep" };\n');

      const resolvedByTypeScript =
        TypeScript.resolveModuleName(
          "./dep",
          fromFilePath,
          compilerOptions,
          TypeScript.sys,
        ).resolvedModule?.resolvedFileName ?? null;

      expect(resolvedByTypeScript).toBeNull();

      const resolvedPath = await resolveImportFilePath(
        "./dep",
        fromFilePath,
        compilerOptions,
      );

      expect(resolvedPath).toBe(NodePath.normalize(depFilePath));
    } finally {
      await rm(tempDirPath, { recursive: true, force: true });
    }
  });
});
