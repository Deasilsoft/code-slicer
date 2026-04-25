import NodePath from "node:path";
import { describe, expect, it } from "vitest";
import { renderCollectedFiles } from "../../src/domains/output/formatter.js";
import { withProject } from "../helpers/project.js";

describe("Plain output format", () => {
  it("renders plain output by default", async () => {
    await withProject(
      {
        "entry.ts": 'import "./dep";\n',
        "dep.ts": 'export const dep = "dep";\n',
      },
      async (project) => {
        const entryFilePath = NodePath.join(project.root, "entry.ts");
        const dependencyFilePath = NodePath.join(project.root, "dep.ts");
        const entryHeading =
          NodePath.relative(process.cwd(), entryFilePath) || entryFilePath;
        const dependencyHeading =
          NodePath.relative(process.cwd(), dependencyFilePath) ||
          dependencyFilePath;

        const output = renderCollectedFiles(
          [
            {
              filePath: entryFilePath,
              sourceCode: 'import "./dep";\n',
            },
            {
              filePath: dependencyFilePath,
              sourceCode: 'export const dep = "dep";\n',
            },
          ],
          undefined,
        );

        expect(output).toContain(`${entryHeading}\nimport "./dep";\n`);
        expect(output).toContain(
          `\n\n${dependencyHeading}\nexport const dep = "dep";\n`,
        );
        expect(output).not.toContain("```\n");
      },
    );
  });
});
