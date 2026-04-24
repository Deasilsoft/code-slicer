import NodePath from "node:path";
import { describe, expect, it } from "vitest";
import { renderCollectedFiles } from "../src/domains/output/formatter.js";
import { withTestProject } from "./helpers/project.js";

describe("Output formatter", () => {
  it("renders plain output by default", async () => {
    await withTestProject(
      {
        "entry.ts": 'import "./dep";\n',
        "dep.ts": 'export const dep = "dep";\n',
      },
      async (projectPath) => {
        const entryFilePath = NodePath.join(projectPath, "entry.ts");
        const dependencyFilePath = NodePath.join(projectPath, "dep.ts");
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

  it("renders markdown headings and fenced code blocks", async () => {
    await withTestProject(
      {
        "entry.ts": 'import "./dep";\n',
        "dep.ts": 'export const dep = "dep";\n',
      },
      async (projectPath) => {
        const entryFilePath = NodePath.join(projectPath, "entry.ts");
        const dependencyFilePath = NodePath.join(projectPath, "dep.ts");
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
    await withTestProject(
      {
        "entry.ts": 'const snippet = "```ts";\nconsole.log(snippet);\n',
      },
      async (projectPath) => {
        const entryFilePath = NodePath.join(projectPath, "entry.ts");
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

  it("renders html sections with escaped content", async () => {
    await withTestProject(
      {
        "entry.ts": 'export const html = "<tag> & value";\n',
      },
      async (projectPath) => {
        const entryFilePath = NodePath.join(projectPath, "entry.ts");
        const entryHeading =
          NodePath.relative(process.cwd(), entryFilePath) || entryFilePath;

        const output = renderCollectedFiles(
          [
            {
              filePath: entryFilePath,
              sourceCode: 'export const html = "<tag> & value";\n',
            },
          ],
          "html",
        );

        expect(output).toContain("<!DOCTYPE html>");
        expect(output).toContain('<html lang="en">');
        expect(output).toContain("<head>");
        expect(output).toContain('  <meta charset="UTF-8">');
        expect(output).toContain("  <title>code-slicer output</title>");
        expect(output).toContain("<body>");
        expect(output).toContain('  <main class="code-slicer-output">');
        expect(output).toContain('<section class="code-slicer-file">');
        expect(output).toContain(`<h3>${entryHeading}</h3>`);
        expect(output).toContain("&lt;tag&gt; &amp; value");
        expect(output).toContain("</html>");
      },
    );
  });

  it("renders xml nodes with escaped content", async () => {
    await withTestProject(
      {
        "entry.ts": "export const xml = '<node attr=\"ok\">';\n",
      },
      async (projectPath) => {
        const entryFilePath = NodePath.join(projectPath, "entry.ts");
        const entryHeading =
          NodePath.relative(process.cwd(), entryFilePath) || entryFilePath;

        const output = renderCollectedFiles(
          [
            {
              filePath: entryFilePath,
              sourceCode: "export const xml = '<node attr=\"ok\">';\n",
            },
          ],
          "xml",
        );

        expect(output).toContain('<?xml version="1.0" encoding="UTF-8"?>');
        expect(output).toContain(`<file path="${entryHeading}">`);
        expect(output).toContain("&lt;node attr=&quot;ok&quot;&gt;");
      },
    );
  });

  it("throws for unsupported output formats", () => {
    expect(() => renderCollectedFiles([], "json")).toThrow(
      "Unsupported output format: json",
    );
  });
});
