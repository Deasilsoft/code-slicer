import NodePath from "node:path";
import { describe, expect, it } from "vitest";
import { collectDependencyFiles } from "../../src/domains/pipeline/index.js";
import { withProject } from "../helpers/project.js";

describe("React file collection", () => {
  it("collects dependencies from a JSX entry", async () => {
    await withProject(
      {
        "entry.jsx":
          'import { dep } from "./dep.js";\nexport function App() {\n  return <div>{dep}</div>;\n}\n',
        "dep.js": 'export const dep = "jsx";\n',
      },
      async (project) => {
        const files = await collectDependencyFiles(project.path("entry.jsx"));

        expect(
          files.map(({ filePath }) =>
            NodePath.relative(project.root, filePath),
          ),
        ).toEqual(["entry.jsx", "dep.js"]);
      },
    );
  });

  it("collects dependencies from a TSX entry", async () => {
    await withProject(
      {
        "entry.tsx":
          'import { dep } from "./dep";\nexport function App() {\n  return <div>{dep}</div>;\n}\n',
        "dep.ts": 'export const dep = "tsx";\n',
      },
      async (project) => {
        const files = await collectDependencyFiles(project.path("entry.tsx"));

        expect(
          files.map(({ filePath }) =>
            NodePath.relative(project.root, filePath),
          ),
        ).toEqual(["entry.tsx", "dep.ts"]);
      },
    );
  });
});
