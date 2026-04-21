import { describe, expect, it } from "vitest";
import { collectDependencyFiles } from "../src/domains/pipeline/index.js";
import {
  getProjectFilePath,
  getRelativeFilePaths,
  withTestProject,
} from "./helpers/project.js";

describe("Stylesheet traversal", () => {
  it.each(["css", "scss", "less"])(
    "includes explicitly imported .%s stylesheet files",
    async (extension) => {
      await withTestProject(
        {
          "entry.js": `import "./styles.${extension}";\n`,
          [`styles.${extension}`]: "body { color: black; }\n",
        },
        async (projectPath) => {
          const files = await collectDependencyFiles(
            getProjectFilePath(projectPath, "entry.js"),
          );

          expect(getRelativeFilePaths(projectPath, files)).toEqual([
            "entry.js",
            `styles.${extension}`,
          ]);
        },
      );
    },
  );

  it.todo("resolves extensionless stylesheet imports to matching files");
});
