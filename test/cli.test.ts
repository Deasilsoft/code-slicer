import { describe, expect, it, vi } from "vitest";
import pkg from "../package.json" with { type: "json" };
import { main } from "../src/main.js";
import { withWorkingDirectory } from "./helpers/cwd.js";
import { withTestProject } from "./helpers/project.js";
import { captureStreams } from "./helpers/streams.js";

type MockedCli = {
  action: ReturnType<typeof vi.fn>;
  command: ReturnType<typeof vi.fn>;
  help: ReturnType<typeof vi.fn>;
  option: ReturnType<typeof vi.fn>;
  outputHelp: ReturnType<typeof vi.fn>;
  parse: ReturnType<typeof vi.fn>;
  runMatchedCommand: ReturnType<typeof vi.fn>;
  version: ReturnType<typeof vi.fn>;
};

async function withMockedCac(
  run: (cli: MockedCli, mockedMain: typeof main) => Promise<void>,
): Promise<void> {
  vi.resetModules();

  const action = vi.fn();
  const outputHelp = vi.fn();
  const parse = vi.fn();
  const runMatchedCommand = vi.fn();
  const option = vi.fn(() => ({ action }));
  const command = vi.fn(() => ({ option }));
  const help = vi.fn();
  const version = vi.fn();

  vi.doMock("cac", () => ({
    cac: vi.fn(() => ({
      command,
      help,
      version,
      outputHelp,
      parse,
      runMatchedCommand,
    })),
  }));

  try {
    const { main: mockedMain } = await import("../src/main.js");

    await run(
      {
        action,
        command,
        help,
        option,
        outputHelp,
        parse,
        runMatchedCommand,
        version,
      },
      mockedMain,
    );
  } finally {
    vi.doUnmock("cac");
    vi.resetModules();
  }
}

describe("CLI behavior", () => {
  it("outputs dependency file paths and contents in plain format by default", async () => {
    await withTestProject(
      {
        "entry.ts": 'import "./dep";\n',
        "dep.ts": 'export const dep = "dep";\n',
      },
      async (projectPath) => {
        const output = captureStreams();

        try {
          await withWorkingDirectory(projectPath, async () => {
            await main(["node", "code-slicer", "entry.ts"]);
          });
        } finally {
          output.restore();
        }

        const stdout = output.stdout();
        const entryHeaderIndex = stdout.indexOf("entry.ts\n");
        const dependencyHeaderIndex = stdout.indexOf("dep.ts\n");

        expect(entryHeaderIndex).toBeGreaterThanOrEqual(0);
        expect(dependencyHeaderIndex).toBeGreaterThan(entryHeaderIndex);
        expect(stdout).toContain('import "./dep";\n');
        expect(stdout).toContain('export const dep = "dep";\n');
        expect(stdout).not.toContain("```\n");
        expect(stdout.endsWith("\n")).toBe(true);
        expect(output.stderr()).toBe("");
      },
    );
  });

  it("outputs dependency files as markdown when requested", async () => {
    await withTestProject(
      {
        "entry.ts": 'import "./dep";\n',
        "dep.ts": 'export const dep = "dep";\n',
      },
      async (projectPath) => {
        const output = captureStreams();

        try {
          await withWorkingDirectory(projectPath, async () => {
            await main([
              "node",
              "code-slicer",
              "entry.ts",
              "--format",
              "markdown",
            ]);
          });
        } finally {
          output.restore();
        }

        const stdout = output.stdout();
        const entryHeaderIndex = stdout.indexOf("### entry.ts\n");
        const dependencyHeaderIndex = stdout.indexOf("### dep.ts\n");

        expect(entryHeaderIndex).toBeGreaterThanOrEqual(0);
        expect(dependencyHeaderIndex).toBeGreaterThan(entryHeaderIndex);
        expect(stdout).toContain("```\n");
        expect(stdout).toContain('import "./dep";\n');
        expect(stdout).toContain('export const dep = "dep";\n');
        expect(stdout).toContain("\n```\n\n### dep.ts");
        expect(output.stderr()).toBe("");
      },
    );
  });

  it("outputs dependency files as html when requested", async () => {
    await withTestProject(
      {
        "entry.ts": 'export const html = "<tag>";\n',
      },
      async (projectPath) => {
        const output = captureStreams();

        try {
          await withWorkingDirectory(projectPath, async () => {
            await main(["node", "code-slicer", "entry.ts", "--format", "html"]);
          });
        } finally {
          output.restore();
        }

        expect(output.stdout()).toContain("<!DOCTYPE html>");
        expect(output.stdout()).toContain('<html lang="en">');
        expect(output.stdout()).toContain(
          '  <main class="code-slicer-output">',
        );
        expect(output.stdout()).toContain("&lt;tag&gt;");
        expect(output.stderr()).toBe("");
      },
    );
  });

  it("outputs dependency files as xml when requested", async () => {
    await withTestProject(
      {
        "entry.ts": "export const xml = '<tag>';\n",
      },
      async (projectPath) => {
        const output = captureStreams();

        try {
          await withWorkingDirectory(projectPath, async () => {
            await main(["node", "code-slicer", "entry.ts", "--format", "xml"]);
          });
        } finally {
          output.restore();
        }

        expect(output.stdout()).toContain(
          '<?xml version="1.0" encoding="UTF-8"?>',
        );
        expect(output.stdout()).toContain("&lt;tag&gt;");
        expect(output.stderr()).toBe("");
      },
    );
  });
});

describe("CLI wiring", () => {
  it("configures cac and shows help without parsing when no args are provided", async () => {
    await withMockedCac(async (cli, mockedMain) => {
      await mockedMain(["node", "code-slicer"]);

      expect(cli.command).toHaveBeenCalledWith(
        "<file-path>",
        "Collect local dependency files and output them in the selected format",
      );
      expect(cli.option).toHaveBeenCalledWith(
        "--format <format>",
        "Output format (plain, markdown, html, xml)",
        {
          default: "plain",
        },
      );
      expect(cli.action).toHaveBeenCalledOnce();
      expect(cli.help).toHaveBeenCalledOnce();
      expect(cli.version).toHaveBeenCalledWith(pkg.version);
      expect(cli.outputHelp).toHaveBeenCalledOnce();
      expect(cli.parse).not.toHaveBeenCalled();
      expect(cli.runMatchedCommand).not.toHaveBeenCalled();
    });
  });

  it("parses argv and runs the matched command when args are provided", async () => {
    await withMockedCac(async (cli, mockedMain) => {
      const argv = ["node", "code-slicer", "entry.ts"];

      await mockedMain(argv);

      expect(cli.outputHelp).not.toHaveBeenCalled();
      expect(cli.parse).toHaveBeenCalledWith(argv, { run: false });
      expect(cli.runMatchedCommand).toHaveBeenCalledOnce();
    });
  });
});
