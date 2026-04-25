import NodePath from "node:path";
import { describe, expect, it } from "vitest";
import { collectDependencyFiles } from "../../src/domains/pipeline/index.js";
import { withWorkingDirectory } from "../helpers/cwd.js";
import { withProject } from "../helpers/project.js";

describe("JavaScript file collection", () => {
  it("collects an ESM entry and its local dependency", async () => {
    await withProject(
      {
        "entry.mjs": 'import { dep } from "./dep.js";\nconsole.log(dep);\n',
        "dep.js": 'export const dep = "esm";\n',
      },
      async (project) => {
        const files = await collectDependencyFiles(project.path("entry.mjs"));

        expect(
          files.map(({ filePath }) =>
            NodePath.relative(project.root, filePath),
          ),
        ).toEqual(["entry.mjs", "dep.js"]);
      },
    );
  });

  it("collects a CJS entry that uses dynamic import", async () => {
    await withProject(
      {
        "entry.cjs": 'import("./dep.cjs");\nmodule.exports = {};\n',
        "dep.cjs": 'module.exports = { dep: "cjs" };\n',
      },
      async (project) => {
        const files = await collectDependencyFiles(project.path("entry.cjs"));

        expect(
          files.map(({ filePath }) =>
            NodePath.relative(project.root, filePath),
          ),
        ).toEqual(["entry.cjs", "dep.cjs"]);
      },
    );
  });

  it("collects dependencies in a pure JavaScript project without tsconfig.json", async () => {
    await withProject(
      {
        "entry.js": 'import "./dep.js";\n',
        "dep.js": 'export const dep = "js";\n',
      },
      async (project) => {
        await withWorkingDirectory(project.root, async () => {
          const files = await collectDependencyFiles(project.path("entry.js"));

          expect(
            files.map(({ filePath }) =>
              NodePath.relative(project.root, filePath),
            ),
          ).toEqual(["entry.js", "dep.js"]);
        });
      },
    );
  });
});
