import NodePath from "node:path";
import { describe, expect, it } from "vitest";
import { renderCollectedFiles } from "../../src/domains/output/formatter.js";
import { withProject } from "../helpers/project.js";

describe("Plain output format", () => {
  it("renders plain output by default", async () => {
    await withProject(
      {
        "entry.ts": 'import "./dep";',
        "dep.ts": 'export const dep = "dep";',
      },
      async (project) => {
        project.chdir();

        const entryFilePath = NodePath.join(project.root, "entry.ts");
        const dependencyFilePath = NodePath.join(project.root, "dep.ts");

        const output = renderCollectedFiles([
          {
            filePath: entryFilePath,
            sourceCode: 'import "./dep";',
          },
          {
            filePath: dependencyFilePath,
            sourceCode: 'export const dep = "dep";',
          },
        ]);

        expect(output).toMatchInlineSnapshot(`
          "entry.ts
          import "./dep";

          dep.ts
          export const dep = "dep";"
        `);
      },
    );
  });
});
