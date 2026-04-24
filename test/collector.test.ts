import { describe, expect, it } from "vitest";
import { collectDependencyFiles } from "../src/domains/pipeline/index.js";
import {
  getProjectFilePath,
  getRelativeFilePaths,
  withTestProject,
} from "./helpers/project.js";

describe("Dependency collection", () => {
  it.each([
    ["png", "logo", "not-a-real-png"],
    ["svg", "icon", '<svg viewBox="0 0 10 10"></svg>\n'],
    ["json", "data", '{"ok":true}\n'],
  ])(
    "includes .%s files imported from TypeScript",
    async (extension, baseName, sourceCode) => {
      const assetFileName = `${baseName}.${extension}`;

      await withTestProject(
        {
          "entry.ts": `import "./${assetFileName}";\n`,
          [assetFileName]: sourceCode,
        },
        async (projectPath) => {
          const files = await collectDependencyFiles(
            getProjectFilePath(projectPath, "entry.ts"),
          );

          expect(getRelativeFilePaths(projectPath, files)).toEqual([
            "entry.ts",
            assetFileName,
          ]);
        },
      );
    },
  );
});
