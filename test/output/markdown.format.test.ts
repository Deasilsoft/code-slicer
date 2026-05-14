import NodePath from "node:path";
import { describe, expect, it } from "vitest";
import { renderCollectedFiles } from "../../src/domains/output/formatter.js";
import { withProject } from "../helpers/project.js";

describe("Markdown output format", () => {
  it("renders markdown headings and fenced code blocks", async () => {
    await withProject(
      {
        "entry.ts": 'import "./dep";',
        "dep.ts": 'export const dep = "dep";',
      },
      async (project) => {
        project.chdir();

        const entryFilePath = NodePath.join(project.root, "entry.ts");
        const dependencyFilePath = NodePath.join(project.root, "dep.ts");

        const output = renderCollectedFiles(
          [
            {
              filePath: entryFilePath,
              sourceCode: 'import "./dep";',
            },
            {
              filePath: dependencyFilePath,
              sourceCode: 'export const dep = "dep";',
            },
          ],
          "markdown",
        );

        expect(output).toMatchInlineSnapshot(`
          "### entry.ts

          \`\`\`
          import "./dep";
          \`\`\`

          ### dep.ts

          \`\`\`
          export const dep = "dep";
          \`\`\`"
        `);
      },
    );
  });

  it("renders markdown with longer fences when source contains triple backticks", async () => {
    await withProject(
      {
        "entry.ts": 'const snippet = "```ts";\nconsole.log(snippet);',
      },
      async (project) => {
        project.chdir();

        const entryFilePath = NodePath.join(project.root, "entry.ts");

        const output = renderCollectedFiles(
          [
            {
              filePath: entryFilePath,
              sourceCode: 'const snippet = "```ts";\nconsole.log(snippet);',
            },
          ],
          "markdown",
        );

        expect(output).toMatchInlineSnapshot(`
          "### entry.ts

          \`\`\`\`
          const snippet = "\`\`\`ts";
          console.log(snippet);
          \`\`\`\`"
        `);
      },
    );
  });
});
