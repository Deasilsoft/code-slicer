import NodePath from "node:path";
import { describe, expect, it } from "vitest";
import { renderCollectedFiles } from "../../src/domains/output/formatter.js";
import { withTestProject } from "../helpers/project.js";

describe("XML output format", () => {
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
});
