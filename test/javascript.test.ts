import { describe, expect, it } from "vitest";
import { collectDependencyFiles } from "../src/domains/pipeline/index.js";
import {
  getProjectFilePath,
  getRelativeFilePaths,
  withTestProject,
} from "./helpers/project.js";
import { withWorkingDirectory } from "./helpers/cwd.js";

describe("JavaScript traversal", () => {
  it("collects an ESM entry and its local dependency", async () => {
    await withTestProject(
      {
        "entry.mjs": 'import { dep } from "./dep.js";\nconsole.log(dep);\n',
        "dep.js": 'export const dep = "esm";\n',
      },
      async (projectPath) => {
        const files = await collectDependencyFiles(
          getProjectFilePath(projectPath, "entry.mjs"),
        );

        expect(getRelativeFilePaths(projectPath, files)).toEqual([
          "entry.mjs",
          "dep.js",
        ]);
      },
    );
  });

  it("collects a CJS entry that uses dynamic import", async () => {
    await withTestProject(
      {
        "entry.cjs": 'import("./dep.cjs");\nmodule.exports = {};\n',
        "dep.cjs": 'module.exports = { dep: "cjs" };\n',
      },
      async (projectPath) => {
        const files = await collectDependencyFiles(
          getProjectFilePath(projectPath, "entry.cjs"),
        );

        expect(getRelativeFilePaths(projectPath, files)).toEqual([
          "entry.cjs",
          "dep.cjs",
        ]);
      },
    );
  });

  it("collects dependencies in a pure JavaScript project without tsconfig.json", async () => {
    await withTestProject(
      {
        "entry.js": 'import "./dep.js";\n',
        "dep.js": 'export const dep = "js";\n',
      },
      async (projectPath) => {
        await withWorkingDirectory(projectPath, async () => {
          const files = await collectDependencyFiles(
            getProjectFilePath(projectPath, "entry.js"),
          );

          expect(getRelativeFilePaths(projectPath, files)).toEqual([
            "entry.js",
            "dep.js",
          ]);
        });
      },
    );
  });
});
