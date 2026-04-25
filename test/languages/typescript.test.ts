import NodePath from "node:path";
import { describe, expect, it } from "vitest";
import { collectDependencyFiles } from "../../src/domains/pipeline/index.js";
import { withProject } from "../helpers/project.js";

describe("TypeScript file collection", () => {
  it("collects dependencies in traversal order", async () => {
    await withProject(
      {
        "entry.ts":
          'import { dep } from "./dep";\nexport { helper } from "./helper";\nconsole.log(dep, helper);\n',
        "dep.ts":
          'import { nested } from "./nested";\nexport const dep = nested;\n',
        "nested.ts": 'export const nested = "nested";\n',
        "helper/index.ts": 'export const helper = "helper";\n',
      },
      async (project) => {
        const files = await collectDependencyFiles(project.path("entry.ts"));

        expect(
          files.map(({ filePath }) =>
            NodePath.relative(project.root, filePath),
          ),
        ).toEqual(["entry.ts", "dep.ts", "nested.ts", "helper/index.ts"]);
      },
    );
  });

  it("keeps resolvable imports and skips missing or external modules", async () => {
    await withProject(
      {
        "entry.ts":
          'import { present } from "./present";\nimport "./missing";\nimport "not-installed-package";\nvoid import("./missing-dynamic");\nconsole.log(present);\n',
        "present.ts": 'export const present = "ok";\n',
      },
      async (project) => {
        const files = await collectDependencyFiles(project.path("entry.ts"));

        expect(
          files.map(({ filePath }) =>
            NodePath.relative(project.root, filePath),
          ),
        ).toEqual(["entry.ts", "present.ts"]);
      },
    );
  });

  it("does not recurse forever when files import each other", async () => {
    await withProject(
      {
        "a.ts": 'import "./b";\nexport const a = "a";\n',
        "b.ts": 'import "./a";\nexport const b = "b";\n',
      },
      async (project) => {
        const files = await collectDependencyFiles(project.path("a.ts"));

        expect(
          files.map(({ filePath }) =>
            NodePath.relative(project.root, filePath),
          ),
        ).toEqual(["a.ts", "b.ts"]);
      },
    );
  });
});
