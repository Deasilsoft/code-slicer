import { describe, expect, it } from "vitest";
import { collectDependencyFiles } from "../src/domains/pipeline/index.js";
import { withWorkingDirectory } from "./helpers/cwd.js";
import { getProjectFilePath, withTestProject } from "./helpers/project.js";

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
});
