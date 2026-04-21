import { describe, expect, it } from "vitest";
import { collectDependencyFiles } from "../src/domains/pipeline/index.js";
import {
  getProjectFilePath,
  getRelativeFilePaths,
  withTestProject,
} from "./helpers/project.js";

describe("React traversal", () => {
  it("collects dependencies from a JSX entry", async () => {
    await withTestProject(
      {
        "entry.jsx":
          'import { dep } from "./dep.js";\nexport function App() {\n  return <div>{dep}</div>;\n}\n',
        "dep.js": 'export const dep = "jsx";\n',
      },
      async (projectPath) => {
        const files = await collectDependencyFiles(
          getProjectFilePath(projectPath, "entry.jsx"),
        );

        expect(getRelativeFilePaths(projectPath, files)).toEqual([
          "entry.jsx",
          "dep.js",
        ]);
      },
    );
  });

  it("collects dependencies from a TSX entry", async () => {
    await withTestProject(
      {
        "entry.tsx":
          'import { dep } from "./dep";\nexport function App() {\n  return <div>{dep}</div>;\n}\n',
        "dep.ts": 'export const dep = "tsx";\n',
      },
      async (projectPath) => {
        const files = await collectDependencyFiles(
          getProjectFilePath(projectPath, "entry.tsx"),
        );

        expect(getRelativeFilePaths(projectPath, files)).toEqual([
          "entry.tsx",
          "dep.ts",
        ]);
      },
    );
  });
});
