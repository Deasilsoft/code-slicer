import { describe, expect, it } from "vitest";
import { collectDependencyFiles } from "../../src/domains/pipeline/index.js";
import {
  getProjectFilePath,
  getRelativeFilePaths,
  withTestProject,
} from "../helpers/project.js";

describe("TypeScript file collection", () => {
  it("collects dependencies in traversal order", async () => {
    await withTestProject(
      {
        "entry.ts":
          'import { dep } from "./dep";\nexport { helper } from "./helper";\nconsole.log(dep, helper);\n',
        "dep.ts":
          'import { nested } from "./nested";\nexport const dep = nested;\n',
        "nested.ts": 'export const nested = "nested";\n',
        "helper/index.ts": 'export const helper = "helper";\n',
      },
      async (projectPath) => {
        const files = await collectDependencyFiles(
          getProjectFilePath(projectPath, "entry.ts"),
        );

        expect(getRelativeFilePaths(projectPath, files)).toEqual([
          "entry.ts",
          "dep.ts",
          "nested.ts",
          "helper/index.ts",
        ]);
      },
    );
  });

  it("keeps resolvable imports and skips missing or external modules", async () => {
    await withTestProject(
      {
        "entry.ts":
          'import { present } from "./present";\nimport "./missing";\nimport "not-installed-package";\nvoid import("./missing-dynamic");\nconsole.log(present);\n',
        "present.ts": 'export const present = "ok";\n',
      },
      async (projectPath) => {
        const files = await collectDependencyFiles(
          getProjectFilePath(projectPath, "entry.ts"),
        );

        expect(getRelativeFilePaths(projectPath, files)).toEqual([
          "entry.ts",
          "present.ts",
        ]);
      },
    );
  });

  it("does not recurse forever when files import each other", async () => {
    await withTestProject(
      {
        "a.ts": 'import "./b";\nexport const a = "a";\n',
        "b.ts": 'import "./a";\nexport const b = "b";\n',
      },
      async (projectPath) => {
        const files = await collectDependencyFiles(
          getProjectFilePath(projectPath, "a.ts"),
        );

        expect(getRelativeFilePaths(projectPath, files)).toEqual([
          "a.ts",
          "b.ts",
        ]);
      },
    );
  });
});
