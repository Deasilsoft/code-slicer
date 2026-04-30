import TypeScript from "typescript";
import { describe, expect, it } from "vitest";
import { resolveImportFilePath } from "../src/domains/pipeline/resolver.js";
import { withProject } from "./helpers/project.js";

const compilerOptions: TypeScript.CompilerOptions = {
  module: TypeScript.ModuleKind.NodeNext,
  moduleResolution: TypeScript.ModuleResolutionKind.NodeNext,
};

describe("Import resolver", () => {
  it("drops imports resolved to node_modules", async () => {
    await withProject(
      {
        "entry.ts": 'import "example-pkg";\n',
        "node_modules/example-pkg/package.json":
          '{"name":"example-pkg","type":"module","exports":"./index.js"}\n',
        "node_modules/example-pkg/index.js":
          'export const value = "external";\n',
      },
      async (project) => {
        const resolvedPath = await resolveImportFilePath(
          "example-pkg",
          project.path("entry.ts"),
          compilerOptions,
        );

        expect(resolvedPath).toBeUndefined();
      },
    );
  });

  it("falls back to candidate file search when TypeScript resolution misses", async () => {
    await withProject(
      {
        "entry.ts": 'import "./dep";\n',
        "dep.cjs": 'module.exports = { dep: "dep" };\n',
      },
      async (project) => {
        const fromFilePath = project.path("entry.ts");
        const depFilePath = project.path("dep.cjs");

        const resolvedByTypeScript = TypeScript.resolveModuleName(
          "./dep",
          fromFilePath,
          compilerOptions,
          TypeScript.sys,
        ).resolvedModule?.resolvedFileName;

        expect(resolvedByTypeScript).toBeUndefined();

        const resolvedPath = await resolveImportFilePath(
          "./dep",
          fromFilePath,
          compilerOptions,
        );

        expect(resolvedPath).toBe(depFilePath);
      },
    );
  });

  it("ignores fallback resolutions that resolve to files inside node_modules", async () => {
    await withProject(
      {
        "entry.ts": 'import "./node_modules/example-pkg";\n',
        "node_modules/example-pkg/index.vue": "<template><div /></template>\n",
      },
      async (project) => {
        const fromFilePath = project.path("entry.ts");

        const resolvedByTypeScript = TypeScript.resolveModuleName(
          "./node_modules/example-pkg",
          fromFilePath,
          compilerOptions,
          TypeScript.sys,
        ).resolvedModule?.resolvedFileName;

        expect(resolvedByTypeScript).toBeUndefined();

        const resolvedPath = await resolveImportFilePath(
          "./node_modules/example-pkg",
          fromFilePath,
          compilerOptions,
        );

        expect(resolvedPath).toBeUndefined();
      },
    );
  });
});
