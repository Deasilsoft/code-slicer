import NodePath from "node:path";
import { describe, expect, it } from "vitest";
import { collectDependencyFiles } from "../../src/domains/pipeline/index.js";
import { withProject } from "../helpers/project.js";

describe("Stylesheet file collection", () => {
  it.each(["css", "scss", "less"])(
    "includes explicitly imported .%s stylesheet files",
    async (extension) => {
      await withProject(
        {
          "entry.js": `import "./styles.${extension}";\n`,
          [`styles.${extension}`]: "body { color: black; }\n",
        },
        async (project) => {
          const files = await collectDependencyFiles(project.path("entry.js"));

          expect(
            files.map(({ filePath }) =>
              NodePath.relative(project.root, filePath),
            ),
          ).toEqual(["entry.js", `styles.${extension}`]);
        },
      );
    },
  );

  it.todo("resolves extensionless stylesheet imports to matching files");
});
