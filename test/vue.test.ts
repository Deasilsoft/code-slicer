import { describe, expect, it, vi } from "vitest";
import { collectDependencyFiles } from "../src/domains/pipeline/index.js";
import {
  getProjectFilePath,
  getRelativeFilePaths,
  withTestProject,
} from "./helpers/project.js";

describe("Vue traversal", () => {
  it("collects a Vue entry and its local TypeScript dependency", async () => {
    await withTestProject(
      {
        "entry.vue":
          '<script setup lang="ts">\nimport { dep } from "./dep";\nconsole.log(dep);\n</script>\n',
        "dep.ts": 'export const dep = "dep";\n',
      },
      async (projectPath) => {
        const files = await collectDependencyFiles(
          getProjectFilePath(projectPath, "entry.vue"),
        );

        expect(getRelativeFilePaths(projectPath, files)).toEqual([
          "entry.vue",
          "dep.ts",
        ]);
      },
    );
  });

  it("collects dependencies from a standard script block", async () => {
    await withTestProject(
      {
        "entry.vue":
          '<script>\nimport { dep } from "./dep.js";\nconsole.log(dep);\n</script>\n',
        "dep.js": 'export const dep = "dep";\n',
      },
      async (projectPath) => {
        const files = await collectDependencyFiles(
          getProjectFilePath(projectPath, "entry.vue"),
        );

        expect(getRelativeFilePaths(projectPath, files)).toEqual([
          "entry.vue",
          "dep.js",
        ]);
      },
    );
  });

  it('collects dependencies from Vue <script lang="jsx"> blocks', async () => {
    await withTestProject(
      {
        "entry.vue": [
          '<script lang="jsx">',
          'import { dep } from "./dep.jsx";',
          "console.log(dep);",
          "</script>",
          "",
        ].join("\n"),
        "dep.jsx": 'export const dep = "jsx";\n',
      },
      async (projectPath) => {
        const files = await collectDependencyFiles(
          getProjectFilePath(projectPath, "entry.vue"),
        );

        expect(getRelativeFilePaths(projectPath, files)).toEqual([
          "entry.vue",
          "dep.jsx",
        ]);
      },
    );
  });

  it('collects dependencies from Vue <script lang="tsx"> blocks', async () => {
    await withTestProject(
      {
        "entry.vue": [
          '<script lang="tsx">',
          'import { dep } from "./dep.tsx";',
          "console.log(dep);",
          "</script>",
          "",
        ].join("\n"),
        "dep.tsx": 'export const dep = "tsx";\n',
      },
      async (projectPath) => {
        const files = await collectDependencyFiles(
          getProjectFilePath(projectPath, "entry.vue"),
        );

        expect(getRelativeFilePaths(projectPath, files)).toEqual([
          "entry.vue",
          "dep.tsx",
        ]);
      },
    );
  });

  it("collects dependencies from both script and script setup blocks", async () => {
    await withTestProject(
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
      async (projectPath) => {
        const files = await collectDependencyFiles(
          getProjectFilePath(projectPath, "entry.vue"),
        );

        expect(getRelativeFilePaths(projectPath, files)).toEqual([
          "entry.vue",
          "first.js",
          "second.ts",
        ]);
      },
    );
  });

  it("collects dynamic imports from a Vue script block", async () => {
    await withTestProject(
      {
        "entry.vue":
          '<script setup lang="ts">\nvoid import("./dep");\n</script>\n',
        "dep.ts": 'export const dep = "dynamic";\n',
      },
      async (projectPath) => {
        const files = await collectDependencyFiles(
          getProjectFilePath(projectPath, "entry.vue"),
        );

        expect(getRelativeFilePaths(projectPath, files)).toEqual([
          "entry.vue",
          "dep.ts",
        ]);
      },
    );
  });

  it("ignores unsupported Vue script languages", async () => {
    await withTestProject(
      {
        "entry.vue":
          '<script lang="coffee">\nimport dep from "./dep";\n</script>\n',
        "dep.ts": 'export const dep = "dep";\n',
      },
      async (projectPath) => {
        const files = await collectDependencyFiles(
          getProjectFilePath(projectPath, "entry.vue"),
        );

        expect(getRelativeFilePaths(projectPath, files)).toEqual(["entry.vue"]);
      },
    );
  });

  it("returns only the entry file when no supported script imports exist", async () => {
    await withTestProject(
      {
        "entry.vue": "<template><div>Hello</div></template>\n",
      },
      async (projectPath) => {
        const files = await collectDependencyFiles(
          getProjectFilePath(projectPath, "entry.vue"),
        );

        expect(getRelativeFilePaths(projectPath, files)).toEqual(["entry.vue"]);
      },
    );
  });

  it("throws when the Vue file cannot be parsed", async () => {
    await withTestProject(
      {
        "entry.vue": "<script setup>\n",
      },
      async (projectPath) => {
        await expect(
          collectDependencyFiles(getProjectFilePath(projectPath, "entry.vue")),
        ).rejects.toThrow(
          `Failed to parse Vue file: ${getProjectFilePath(projectPath, "entry.vue")}`,
        );
      },
    );
  });

  it("throws an install hint when Vue compiler dependency is missing", async () => {
    await withTestProject(
      {
        "entry.vue": '<script setup>\nimport "./dep";\n</script>\n',
      },
      async (projectPath) => {
        vi.resetModules();

        vi.doMock("node:module", async () => {
          const nodeModule =
            await vi.importActual<typeof import("node:module")>("node:module");
          const realRequire = nodeModule.createRequire(import.meta.url);

          return {
            ...nodeModule,
            createRequire: () => {
              return ((moduleName: string) => {
                if (moduleName === "@vue/compiler-sfc") {
                  const missingModuleError = new Error(
                    "Cannot find module '@vue/compiler-sfc'",
                  ) as Error & { code?: string };

                  missingModuleError.code = "MODULE_NOT_FOUND";

                  throw missingModuleError;
                }

                return realRequire(moduleName);
              }) as NodeJS.Require;
            },
          };
        });

        try {
          const { collectDependencyFiles: collectDependencyFilesWithMock } =
            await import("../src/domains/pipeline/index.js");

          await expect(
            collectDependencyFilesWithMock(
              getProjectFilePath(projectPath, "entry.vue"),
            ),
          ).rejects.toThrow(
            "Vue support requires optional dependency @vue/compiler-sfc. Install it with: npm install @vue/compiler-sfc",
          );
        } finally {
          vi.doUnmock("node:module");
          vi.resetModules();
        }
      },
    );
  });

  it("rethrows non-missing-module errors when loading Vue compiler", async () => {
    await withTestProject(
      {
        "entry.vue": '<script setup>\nimport "./dep";\n</script>\n',
      },
      async (projectPath) => {
        vi.resetModules();

        vi.doMock("node:module", async () => {
          const nodeModule =
            await vi.importActual<typeof import("node:module")>("node:module");
          const realRequire = nodeModule.createRequire(import.meta.url);

          return {
            ...nodeModule,
            createRequire: () => {
              return ((moduleName: string) => {
                if (moduleName === "@vue/compiler-sfc") {
                  const permissionError = new Error(
                    "Permission denied",
                  ) as Error & {
                    code?: string;
                  };

                  permissionError.code = "EACCES";

                  throw permissionError;
                }

                return realRequire(moduleName);
              }) as NodeJS.Require;
            },
          };
        });

        try {
          const { collectDependencyFiles: collectDependencyFilesWithMock } =
            await import("../src/domains/pipeline/index.js");

          await expect(
            collectDependencyFilesWithMock(
              getProjectFilePath(projectPath, "entry.vue"),
            ),
          ).rejects.toThrow("Permission denied");
        } finally {
          vi.doUnmock("node:module");
          vi.resetModules();
        }
      },
    );
  });
});
