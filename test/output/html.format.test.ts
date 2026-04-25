import NodePath from "node:path";
import { describe, expect, it } from "vitest";
import { renderCollectedFiles } from "../../src/domains/output/formatter.js";
import { withProject } from "../helpers/project.js";

describe("HTML output format", () => {
  it("renders html sections with escaped content", async () => {
    await withProject(
      {
        "entry.ts": 'export const html = "<tag> & value";\n',
      },
      async (project) => {
        const entryFilePath = NodePath.join(project.root, "entry.ts");
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
});
