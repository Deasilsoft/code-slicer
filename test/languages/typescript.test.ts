import NodePath from "node:path";
import { describe, expect, it } from "vitest";
import { collectDependencyFiles } from "../../src/domains/pipeline/index.js";
import { withProject } from "../helpers/project.js";

function getRelativeFilePaths(
  projectRoot: string,
  filePaths: { filePath: string }[],
): string[] {
  return filePaths.map(({ filePath }) =>
    NodePath.relative(projectRoot, filePath),
  );
}

function getNestedAliasFixture() {
  return {
    "tsconfig.json": JSON.stringify({
      compilerOptions: {
        moduleResolution: "bundler",
      },
    }),
    "web/tsconfig.json": JSON.stringify({
      compilerOptions: {
        module: "ESNext",
        moduleResolution: "bundler",
        baseUrl: ".",
        paths: {
          "@/*": ["./src/*"],
        },
      },
      include: ["src/**/*.ts", "src/**/*.tsx"],
    }),
    "web/src/domains/blog/articles.site-index.ts":
      'import { articleService } from "@/domains/blog/article.composition.js";\nvoid articleService;\n',
    "web/src/domains/blog/article.composition.ts":
      'export const articleService = "article";\n',
  };
}

describe("TypeScript file collection", () => {
  it("collects dependencies in traversal order", async () => {
    await withProject(
      {
        "entry.ts":
          'import { dep } from "./dep";\nexport { helper } from "./helper";\nconsole.log(dep, helper);\n',
        "dep.ts":
          'import { nested } from "./nested";\nexport const dep = nested;\n',
        "nested.ts": 'export const nested = "nested";\n',
        "helper/index.ts": 'export const helper = "helper";\n',
      },
      async (project) => {
        const files = await collectDependencyFiles(project.path("entry.ts"));

        expect(
          files.map(({ filePath }) =>
            NodePath.relative(project.root, filePath),
          ),
        ).toEqual(["entry.ts", "dep.ts", "nested.ts", "helper/index.ts"]);
      },
    );
  });

  it("keeps resolvable imports and skips missing or external modules", async () => {
    await withProject(
      {
        "entry.ts":
          'import { present } from "./present";\nimport "./missing";\nimport "not-installed-package";\nvoid import("./missing-dynamic");\nconsole.log(present);\n',
        "present.ts": 'export const present = "ok";\n',
      },
      async (project) => {
        const files = await collectDependencyFiles(project.path("entry.ts"));

        expect(
          files.map(({ filePath }) =>
            NodePath.relative(project.root, filePath),
          ),
        ).toEqual(["entry.ts", "present.ts"]);
      },
    );
  });

  it("collects side-effect and type-only local imports", async () => {
    await withProject(
      {
        "entry.ts":
          'import "./setup";\nimport type { LocalType } from "./types";\nconst value: LocalType = { ok: true };\nvoid value;\n',
        "setup.ts": 'globalThis.__setup = "ok";\n',
        "types.ts": "export type LocalType = { ok: boolean };\n",
      },
      async (project) => {
        const files = await collectDependencyFiles(project.path("entry.ts"));

        expect(getRelativeFilePaths(project.root, files)).toEqual([
          "entry.ts",
          "setup.ts",
          "types.ts",
        ]);
      },
    );
  });

  it("does not recurse forever when files import each other", async () => {
    await withProject(
      {
        "a.ts": 'import "./b";\nexport const a = "a";\n',
        "b.ts": 'import "./a";\nexport const b = "b";\n',
      },
      async (project) => {
        const files = await collectDependencyFiles(project.path("a.ts"));

        expect(
          files.map(({ filePath }) =>
            NodePath.relative(project.root, filePath),
          ),
        ).toEqual(["a.ts", "b.ts"]);
      },
    );
  });

  it("resolves aliases from the nearest nested tsconfig.json", async () => {
    await withProject(getNestedAliasFixture(), async (project) => {
      const files = await collectDependencyFiles(
        project.path("web/src/domains/blog/articles.site-index.ts"),
      );

      expect(getRelativeFilePaths(project.root, files)).toEqual([
        "web/src/domains/blog/articles.site-index.ts",
        "web/src/domains/blog/article.composition.ts",
      ]);
    });
  });

  it("uses entry-file tsconfig lookup even when cwd is the fixture root", async () => {
    await withProject(getNestedAliasFixture(), async (project) => {
      project.chdir();

      const files = await collectDependencyFiles(
        project.path("web/src/domains/blog/articles.site-index.ts"),
      );

      expect(getRelativeFilePaths(project.root, files)).toEqual([
        "web/src/domains/blog/articles.site-index.ts",
        "web/src/domains/blog/article.composition.ts",
      ]);
    });
  });

  it("uses an explicit projectFilePath override when provided", async () => {
    await withProject(
      {
        "tsconfig.json": JSON.stringify({
          compilerOptions: {
            moduleResolution: "bundler",
          },
        }),
        "web/src/domains/blog/articles.site-index.ts":
          'import { articleService } from "@/domains/blog/article.composition.js";\nvoid articleService;\n',
        "web/src/domains/blog/article.composition.ts":
          'export const articleService = "article";\n',
        "web/tsconfig.custom.json": JSON.stringify({
          compilerOptions: {
            module: "ESNext",
            moduleResolution: "bundler",
            baseUrl: ".",
            paths: {
              "@/*": ["./src/*"],
            },
          },
        }),
      },
      async (project) => {
        const files = await collectDependencyFiles(
          project.path("web/src/domains/blog/articles.site-index.ts"),
          project.path("web/tsconfig.custom.json"),
        );

        expect(getRelativeFilePaths(project.root, files)).toEqual([
          "web/src/domains/blog/articles.site-index.ts",
          "web/src/domains/blog/article.composition.ts",
        ]);
      },
    );
  });

  it("falls back to empty compiler options when no tsconfig exists", async () => {
    await withProject(
      {
        "entry.ts": 'import "./dep";\n',
        "dep.ts": 'export const dep = "dep";\n',
      },
      async (project) => {
        const files = await collectDependencyFiles(project.path("entry.ts"));

        expect(getRelativeFilePaths(project.root, files)).toEqual([
          "entry.ts",
          "dep.ts",
        ]);
      },
    );
  });

  it("ignores bare package imports while collecting local dependencies", async () => {
    await withProject(
      {
        "entry.ts":
          'import React from "react";\nimport "./local";\nvoid React;\n',
        "local.ts": 'export const local = "local";\n',
      },
      async (project) => {
        const files = await collectDependencyFiles(project.path("entry.ts"));
        const relativeFilePaths = getRelativeFilePaths(project.root, files);

        expect(relativeFilePaths).toEqual(["entry.ts", "local.ts"]);
        expect(
          relativeFilePaths.some((filePath) => filePath.includes("react")),
        ).toBe(false);
      },
    );
  });
});
