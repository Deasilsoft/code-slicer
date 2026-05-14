import NodePath from "node:path";
import { describe, expect, it } from "vitest";
import { renderCollectedFiles } from "../../src/domains/output/formatter.js";
import { withProject } from "../helpers/project.js";

describe("XML output format", () => {
  it("renders xml nodes with escaped content", async () => {
    await withProject(
      {
        "entry.ts": "export const xml = '<node attr=\"ok\">';",
      },
      async (project) => {
        project.chdir();

        const entryFilePath = NodePath.join(project.root, "entry.ts");

        const output = renderCollectedFiles(
          [
            {
              filePath: entryFilePath,
              sourceCode: "export const xml = '<node attr=\"ok\">';",
            },
          ],
          "xml",
        );

        expect(output).toMatchInlineSnapshot(`
          "<?xml version="1.0" encoding="UTF-8"?>
          <files>
            <file path="entry.ts">
              <source>export const xml = &apos;&lt;node attr=&quot;ok&quot;&gt;&apos;;</source>
            </file>
          </files>"
        `);
      },
    );
  });
});
