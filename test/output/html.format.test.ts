import NodePath from "node:path";
import { describe, expect, it } from "vitest";
import { renderCollectedFiles } from "../../src/domains/output/formatter.js";
import { withProject } from "../helpers/project.js";

describe("HTML output format", () => {
  it("renders html sections with escaped content", async () => {
    await withProject(
      {
        "entry.ts": 'export const html = "<tag> & value";',
      },
      async (project) => {
        project.chdir();

        const entryFilePath = NodePath.join(project.root, "entry.ts");

        const output = renderCollectedFiles(
          [
            {
              filePath: entryFilePath,
              sourceCode: 'export const html = "<tag> & value";',
            },
          ],
          "html",
        );

        expect(output).toMatchInlineSnapshot(`
          "<!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <title>code-slicer output</title>
          </head>
          <body>
            <main class="code-slicer-output">
              <section class="code-slicer-file">
                <h3>entry.ts</h3>
                <pre><code>export const html = &quot;&lt;tag&gt; &amp; value&quot;;</code></pre>
              </section>
            </main>
          </body>
          </html>"
        `);
      },
    );
  });
});
