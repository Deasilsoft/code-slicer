import { describe, expect, it } from "vitest";
import { main } from "../src/main.js";
import { withWorkingDirectory } from "./helpers/cwd.js";
import { withTestProject } from "./helpers/project.js";

describe("CLI errors", () => {
  it("throws for unsupported output format", async () => {
    await withTestProject(
      {
        "entry.ts": 'export const entry = "entry";\n',
      },
      async (projectPath) => {
        await expect(
          withWorkingDirectory(projectPath, async () => {
            await main(["node", "code-slicer", "entry.ts", "--format", "json"]);
          }),
        ).rejects.toThrow("Unsupported output format: json");
      },
    );
  });

  it("throws when the specified entry file does not exist", async () => {
    await withTestProject({}, async (projectPath) => {
      await expect(
        withWorkingDirectory(projectPath, async () => {
          await main(["node", "code-slicer", "missing.ts"]);
        }),
      ).rejects.toThrow("Entry file not found:");
    });
  });
});
