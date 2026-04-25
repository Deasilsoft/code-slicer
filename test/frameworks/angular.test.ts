import NodePath from "node:path";
import { describe, expect, it } from "vitest";
import { collectDependencyFiles } from "../../src/domains/pipeline/index.js";
import { withProject } from "../helpers/project.js";

describe("Angular file collection", () => {
  it("collects TypeScript dependencies imported by a file with Angular component metadata", async () => {
    await withProject(
      {
        "entry.ts":
          'import { AppComponent } from "./app.component";\nvoid AppComponent;\n',
        "app.component.ts": [
          'import { helper } from "./helper";',
          "@Component({",
          "  selector: 'app-root',",
          "  templateUrl: './app.component.html',",
          "  styleUrls: ['./app.component.scss'],",
          "})",
          "export class AppComponent {}",
          "void helper;",
          "",
        ].join("\n"),
        "helper.ts": 'export const helper = "helper";\n',
        "app.component.html": "<p>Hello</p>\n",
        "app.component.scss": "p { color: red; }\n",
      },
      async (project) => {
        const files = await collectDependencyFiles(project.path("entry.ts"));

        expect(
          files.map(({ filePath }) =>
            NodePath.relative(project.root, filePath),
          ),
        ).toEqual(["entry.ts", "app.component.ts", "helper.ts"]);
      },
    );
  });

  it.todo(
    "includes Angular template and style files referenced in component metadata",
  );
});
