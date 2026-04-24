import { describe, expect, it } from "vitest";
import { collectDependencyFiles } from "../../src/domains/pipeline/index.js";
import {
  getProjectFilePath,
  getRelativeFilePaths,
  withTestProject,
} from "../helpers/project.js";

describe("Vue file collection", () => {
  async function expectCollectedFiles(
    files: Record<string, string>,
    expected: string[],
  ): Promise<void> {
    await withTestProject(files, async (projectPath) => {
      const collectedFiles = await collectDependencyFiles(
        getProjectFilePath(projectPath, "entry.vue"),
      );

      expect(getRelativeFilePaths(projectPath, collectedFiles)).toEqual(
        expected,
      );
    });
  }

  it.each([
    {
      name: "standard script block",
      entry:
        '<script>\nimport { dep } from "./dep.js";\nconsole.log(dep);\n</script>\n',
      depName: "dep.js",
      depSource: 'export const dep = "dep";\n',
    },
    {
      name: "script setup with TypeScript",
      entry:
        '<script setup lang="ts">\nimport { dep } from "./dep";\nconsole.log(dep);\n</script>\n',
      depName: "dep.ts",
      depSource: 'export const dep = "dep";\n',
    },
    {
      name: "script with JSX",
      entry:
        '<script lang="jsx">\nimport { dep } from "./dep.jsx";\nconsole.log(dep);\n</script>\n',
      depName: "dep.jsx",
      depSource: 'export const dep = "jsx";\n',
    },
    {
      name: "script with TSX",
      entry:
        '<script lang="tsx">\nimport { dep } from "./dep.tsx";\nconsole.log(dep);\n</script>\n',
      depName: "dep.tsx",
      depSource: 'export const dep = "tsx";\n',
    },
  ])(
    "collects dependencies from $name",
    async ({ entry, depName, depSource }) => {
      await expectCollectedFiles(
        {
          "entry.vue": entry,
          [depName]: depSource,
        },
        ["entry.vue", depName],
      );
    },
  );

  it("collects dependencies from both script and script setup blocks", async () => {
    await expectCollectedFiles(
      {
        "entry.vue": [
          "<script>",
          'import { first } from "./first.js";',
          "console.log(first);",
          "</script>",
          '<script setup lang="ts">',
          'import { second } from "./second";',
          "console.log(second);",
          "</script>",
          "",
        ].join("\n"),
        "first.js": 'export const first = "first";\n',
        "second.ts": 'export const second = "second";\n',
      },
      ["entry.vue", "first.js", "second.ts"],
    );
  });

  it("collects dynamic imports from a Vue script block", async () => {
    await expectCollectedFiles(
      {
        "entry.vue":
          '<script setup lang="ts">\nvoid import("./dep");\n</script>\n',
        "dep.ts": 'export const dep = "dynamic";\n',
      },
      ["entry.vue", "dep.ts"],
    );
  });

  it.each<{
    name: string;
    entry: string;
    files: Record<string, string>;
  }>([
    {
      name: "unsupported script language",
      entry: '<script lang="coffee">\nimport dep from "./dep";\n</script>\n',
      files: { "dep.ts": 'export const dep = "dep";\n' },
    },
    {
      name: "template only",
      entry: "<template><div>Hello</div></template>\n",
      files: {},
    },
  ])("returns only entry file for $name", async ({ entry, files }) => {
    await expectCollectedFiles(
      {
        "entry.vue": entry,
        ...files,
      },
      ["entry.vue"],
    );
  });
});
