import { describe, expect, it, vi } from "vitest";
import { collectDependencyFiles } from "../../src/domains/pipeline/index.js";
import { getProjectFilePath, withTestProject } from "../helpers/project.js";

type MockedCompilerErrorCase = {
  expected: string | RegExp;
  mode: "toThrow" | "toBe";
  thrown: unknown;
};

describe("Vue file collection errors", () => {
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

  it.each<MockedCompilerErrorCase>([
    {
      expected:
        "Vue support requires optional dependency @vue/compiler-sfc. Install it with: npm install @vue/compiler-sfc",
      mode: "toThrow",
      thrown: Object.assign(
        new Error(
          [
            "Cannot find module 'estree-walker'",
            "Cannot find module '@vue/compiler-sfc'",
          ].join("\n"),
        ),
        {
          code: "MODULE_NOT_FOUND",
        },
      ),
    },
    {
      expected: "Cannot find module 'estree-walker'",
      mode: "toThrow",
      thrown: Object.assign(
        new Error(
          [
            "Cannot find module 'estree-walker'",
            "Require stack:",
            "- /some/path/node_modules/@vue/compiler-sfc/dist/compiler-sfc.cjs.js",
          ].join("\n"),
        ),
        {
          code: "MODULE_NOT_FOUND",
        },
      ),
    },
    {
      expected: "Permission denied",
      mode: "toThrow",
      thrown: Object.assign(new Error("Permission denied"), {
        code: "EACCES",
      }),
    },
    {
      expected: "unexpected",
      mode: "toBe",
      thrown: "unexpected",
    },
  ])("handles compiler load failure %#", async ({ thrown, mode, expected }) => {
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
                  throw thrown;
                }

                return realRequire(moduleName);
              }) as NodeJS.Require;
            },
          };
        });

        try {
          const { collectDependencyFiles: collectDependencyFilesWithMock } =
            await import("../../src/domains/pipeline/index.js");

          const run = collectDependencyFilesWithMock(
            getProjectFilePath(projectPath, "entry.vue"),
          );

          if (mode === "toThrow") {
            await expect(run).rejects.toThrow(expected);
          } else {
            await expect(run).rejects.toBe(expected);
          }
        } finally {
          vi.doUnmock("node:module");
          vi.resetModules();
        }
      },
    );
  });
});
