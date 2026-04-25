import NodePath from "node:path";
import { describe, expect, it } from "vitest";
import { collectDependencyFiles } from "../src/domains/pipeline/index.js";
import { withProject } from "./helpers/project.js";

describe("Dependency collection", () => {
  it.each([
    ["png", "logo", "not-a-real-png"],
    ["svg", "icon", '<svg viewBox="0 0 10 10"></svg>\n'],
    ["json", "data", '{"ok":true}\n'],
  ])(
    "includes .%s files imported from TypeScript",
    async (extension, baseName, sourceCode) => {
      const assetFileName = `${baseName}.${extension}`;

      await withProject(
        {
          "entry.ts": `import "./${assetFileName}";\n`,
          [assetFileName]: sourceCode,
        },
        async (project) => {
          const files = await collectDependencyFiles(project.path("entry.ts"));

          expect(
            files.map(({ filePath }) =>
              NodePath.relative(project.root, filePath),
            ),
          ).toEqual(["entry.ts", assetFileName]);
        },
      );
    },
  );
});
