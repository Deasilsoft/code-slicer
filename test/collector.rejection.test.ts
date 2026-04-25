import { describe, expect, it } from "vitest";
import { collectDependencyFiles } from "../src/domains/pipeline/index.js";
import { withWorkingDirectory } from "./helpers/cwd.js";
import { withProject } from "./helpers/project.js";

describe("Dependency collection errors", () => {
  it("throws when the entry file does not exist", async () => {
    await withProject({}, async (project) => {
      const missingEntryPath = project.path("missing-entry.ts");

      await expect(collectDependencyFiles(missingEntryPath)).rejects.toThrow(
        `Entry file not found: ${missingEntryPath}`,
      );
    });
  });

  it("throws when tsconfig.json is invalid", async () => {
    await withProject(
      {
        "entry.ts": 'export const value = "entry";\n',
        "tsconfig.json": "{",
      },
      async (project) => {
        await withWorkingDirectory(project.root, async () => {
          await expect(
            collectDependencyFiles(project.path("entry.ts")),
          ).rejects.toThrow();
        });
      },
    );
  });
});
