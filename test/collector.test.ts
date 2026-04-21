import { describe, expect, it } from "vitest";
import { collectDependencyFiles } from "../src/domains/pipeline/index.js";
import { withWorkingDirectory } from "./helpers/cwd.js";
import {
  getProjectFilePath,
  getRelativeFilePaths,
  withTestProject,
} from "./helpers/project.js";

describe("collector", () => {
  it("throws when the entry file does not exist", async () => {
    await withTestProject({}, async (projectPath) => {
      const missingEntryPath = getProjectFilePath(
        projectPath,
        "missing-entry.ts",
      );

      await expect(collectDependencyFiles(missingEntryPath)).rejects.toThrow(
        `Entry file not found: ${missingEntryPath}`,
      );
    });
  });

  it("throws when tsconfig.json is invalid", async () => {
    await withTestProject(
      {
        "entry.ts": 'export const value = "entry";\n',
        "tsconfig.json": "{",
      },
      async (projectPath) => {
        await withWorkingDirectory(projectPath, async () => {
          await expect(
            collectDependencyFiles(getProjectFilePath(projectPath, "entry.ts")),
          ).rejects.toThrow();
        });
      },
    );
  });

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
