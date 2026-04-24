import { describe, expect, it } from "vitest";
import { collectDependencyFiles } from "../../src/domains/pipeline/index.js";
import {
  getProjectFilePath,
  getRelativeFilePaths,
  withTestProject,
} from "../helpers/project.js";

describe("Angular file collection", () => {
  it("collects TypeScript dependencies imported by a file with Angular component metadata", async () => {
    await withTestProject(
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
      async (projectPath) => {
        const files = await collectDependencyFiles(
          getProjectFilePath(projectPath, "entry.ts"),
        );

        expect(getRelativeFilePaths(projectPath, files)).toEqual([
          "entry.ts",
          "app.component.ts",
          "helper.ts",
        ]);
      },
    );
  });

  it.todo(
    "includes Angular template and style files referenced in component metadata",
  );
});
