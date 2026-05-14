import NodeConstants from "node:constants";
import NodeFS from "node:fs/promises";
import NodePath from "node:path";
import { spawnSync } from "node:child_process";
import { beforeAll, describe, expect, it } from "vitest";

const repoRoot = process.cwd();
const distBinPath = NodePath.join(repoRoot, "dist/bin.js");
const aliasFixtureRoot = NodePath.join(repoRoot, "test/fixtures/alias-project");

type PackDryRunOutput = {
  files: Array<{
    path: string;
  }>;
};

function parseJsonArrayFromOutput(value: string): PackDryRunOutput[] {
  try {
    return JSON.parse(value) as PackDryRunOutput[];
  } catch {
    throw new Error(`Could not parse npm pack --json output:\n${value}`);
  }
}

function expectSuccessfulCommand(result: ReturnType<typeof spawnSync>): void {
  expect(result.status, `${result.stdout}${result.stderr}`).toBe(0);
}

type CommandResult = {
  output: string;
  status: number | null;
  stderr: string;
  stdout: string;
};

function runNode(args: string[], cwd: string): CommandResult {
  const result = spawnSync(process.execPath, args, {
    cwd,
    encoding: "utf8",
  });

  return {
    output: `${result.stdout}${result.stderr}`,
    status: result.status,
    stderr: result.stderr,
    stdout: result.stdout,
  };
}

function runPackagedCli(args: string[], cwd = aliasFixtureRoot): CommandResult {
  return runNode([distBinPath, ...args], cwd);
}

describe("Package", () => {
  beforeAll(() => {
    const buildResult = spawnSync("npm", ["run", "build"], {
      cwd: repoRoot,
      encoding: "utf8",
    });

    expectSuccessfulCommand(buildResult);
  });

  describe("artifact", () => {
    it("includes executable CLI/runtime files and preserves package metadata contracts", async () => {
      const packResult = spawnSync(
        "npm",
        ["pack", "--dry-run", "--json", "--ignore-scripts"],
        {
          cwd: repoRoot,
          encoding: "utf8",
        },
      );

      expectSuccessfulCommand(packResult);

      const parsed = parseJsonArrayFromOutput(packResult.stdout);
      const packedFiles = parsed[0]?.files.map(({ path }) => path) ?? [];

      expect(packedFiles).toContain("dist/bin.js");
      expect(packedFiles).toContain("dist/main.js");
      expect(packedFiles).toContain("dist/domains/output/formatter.js");
      expect(packedFiles).toContain("dist/domains/pipeline/resolver.js");
      expect(packedFiles).toContain("dist/domains/parsers/vue.parser.js");

      const binContent = await NodeFS.readFile(distBinPath, "utf8");

      expect(binContent.startsWith("#!/usr/bin/env node")).toBe(true);
      await expect(
        NodeFS.access(distBinPath, NodeConstants.X_OK),
      ).resolves.toBeUndefined();

      const packageJson = JSON.parse(
        await NodeFS.readFile(NodePath.join(repoRoot, "package.json"), "utf8"),
      ) as {
        bin?: Record<string, string>;
        dependencies?: Record<string, string>;
      };

      expect(packageJson.bin?.["code-slicer"]).toBe("./dist/bin.js");
      expect(packageJson.dependencies?.["@vue/compiler-sfc"]).toBeUndefined();
    });
  });

  describe("packaged CLI", () => {
    it("resolves configured path aliases when invoked through the packaged bin", () => {
      const result = runPackagedCli(["src/main.js"]);

      expect(result.status, result.output).toBe(0);
      expect(result.stdout).toContain("src/main.js");
      expect(result.stdout).toContain("src/lib/util.ts");
      expect(result.stderr).toBe("");
    });

    it.each([
      [
        "plain",
        ["src/main.js", 'export { util as mainValue } from "@/lib/util";'],
      ],
      ["markdown", ["### src/main.js", "```"]],
      ["html", ["<!DOCTYPE html>", '<html lang="en">']],
      ["xml", ['<?xml version="1.0" encoding="UTF-8"?>', "<files>"]],
    ] as const)(
      "supports --format %s through dist/bin.js",
      (format, expectedOutputs) => {
        const result = runPackagedCli(["src/main.js", "--format", format]);

        expect(result.status, result.output).toBe(0);
        expect(result.stderr).toBe("");

        for (const expectedOutput of expectedOutputs) {
          expect(result.stdout).toContain(expectedOutput);
        }

        if (format === "plain") {
          expect(result.stdout).not.toContain("```\n");
        }
      },
    );

    it("exits non-zero for unsupported format and prints a useful error", () => {
      const result = runPackagedCli(["src/main.js", "--format", "json"]);

      expect(result.status).not.toBe(0);
      expect(result.output).toContain("Unsupported output format: json");
    });

    it("exits non-zero for a missing entry file and prints a useful error", () => {
      const result = runPackagedCli(["src/missing.ts"]);

      expect(result.status).not.toBe(0);
      expect(result.output).toContain("Entry file not found:");
    });
  });
});
