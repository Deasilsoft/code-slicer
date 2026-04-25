import NodePath from "node:path";
import { describe, expect, it } from "vitest";
import { renderCollectedFiles } from "../../src/domains/output/formatter.js";
import { withProject } from "../helpers/project.js";

describe("Markdown output format", () => {
  it("renders markdown headings and fenced code blocks", async () => {
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
          "markdown",
        );

        expect(output).toContain(`### ${entryHeading}\n\n\`\`\`\n`);
        expect(output).toContain('import "./dep";\n');
        expect(output).toContain(
          `\n\`\`\`\n\n### ${dependencyHeading}\n\n\`\`\`\n`,
        );
        expect(output).toContain('export const dep = "dep";\n');
      },
    );
  });

  it("renders markdown with longer fences when source contains triple backticks", async () => {
    await withProject(
      {
        "entry.ts": 'const snippet = "```ts";\nconsole.log(snippet);\n',
      },
      async (project) => {
        const entryFilePath = NodePath.join(project.root, "entry.ts");
        const entryHeading =
          NodePath.relative(process.cwd(), entryFilePath) || entryFilePath;

        const output = renderCollectedFiles(
          [
            {
              filePath: entryFilePath,
              sourceCode: 'const snippet = "```ts";\nconsole.log(snippet);\n',
            },
          ],
          "markdown",
        );

        expect(output).toContain(`### ${entryHeading}\n\n\`\`\`\`\n`);
        expect(output).toContain('const snippet = "```ts";\n');
        expect(output).toContain("\n````");
      },
    );
  });
});
