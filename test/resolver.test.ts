import TypeScript from "typescript";
import { describe, expect, it } from "vitest";
import { resolveImportFilePath } from "../src/domains/pipeline/resolver.js";
import { getProjectFilePath, withTestProject } from "./helpers/project.js";

const compilerOptions: TypeScript.CompilerOptions = {
  module: TypeScript.ModuleKind.NodeNext,
  moduleResolution: TypeScript.ModuleResolutionKind.NodeNext,
};

describe("resolver", () => {
  it("drops imports resolved to node_modules", async () => {
    await withTestProject(
      {
        "entry.ts": 'import "example-pkg";\n',
        "node_modules/example-pkg/package.json":
          '{"name":"example-pkg","type":"module","exports":"./index.js"}\n',
        "node_modules/example-pkg/index.js":
          'export const value = "external";\n',
      },
      async (projectPath) => {
        const resolvedPath = await resolveImportFilePath(
          "example-pkg",
          getProjectFilePath(projectPath, "entry.ts"),
          compilerOptions,
        );

        expect(resolvedPath).toBeNull();
      },
    );
  });

  it("falls back to candidate file search when TypeScript resolution misses", async () => {
    await withTestProject(
      {
        "entry.ts": 'import "./dep";\n',
        "dep.cjs": 'module.exports = { dep: "dep" };\n',
      },
      async (projectPath) => {
        const fromFilePath = getProjectFilePath(projectPath, "entry.ts");
        const depFilePath = getProjectFilePath(projectPath, "dep.cjs");

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

        expect(resolvedPath).toBe(depFilePath);
      },
    );
  });
});
