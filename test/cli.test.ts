import { describe, expect, it, vi } from "vitest";
import pkg from "../package.json" with { type: "json" };
import { main } from "../src/main.js";
import { withWorkingDirectory } from "./helpers/cwd.js";
import { withTestProject } from "./helpers/project.js";

function captureStreams() {
  let stdout = "";
  let stderr = "";

  const stdoutSpy = vi
    .spyOn(process.stdout, "write")
    .mockImplementation((chunk: string | Uint8Array) => {
      stdout +=
        typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8");

      return true;
    });

  const stderrSpy = vi
    .spyOn(process.stderr, "write")
    .mockImplementation((chunk: string | Uint8Array) => {
      stderr +=
        typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8");

      return true;
    });

  return {
    stdout: () => stdout,
    stderr: () => stderr,
    restore: () => {
      stdoutSpy.mockRestore();
      stderrSpy.mockRestore();
    },
  };
}

type MockedCli = {
  action: ReturnType<typeof vi.fn>;
  command: ReturnType<typeof vi.fn>;
  help: ReturnType<typeof vi.fn>;
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
  const command = vi.fn(() => ({ action }));
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
  it("outputs dependency file paths and contents when executed via the CLI", async () => {
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
        expect(output.stderr()).toBe("");
      },
    );
  });

  it("throws an error when the specified entry file does not exist", async () => {
    await withTestProject({}, async (projectPath) => {
      await expect(
        withWorkingDirectory(projectPath, async () => {
          await main(["node", "code-slicer", "missing.ts"]);
        }),
      ).rejects.toThrow("Entry file not found:");
    });
  });
});

describe("CLI wiring", () => {
  it("configures cac and shows help without parsing when no args are provided", async () => {
    await withMockedCac(async (cli, mockedMain) => {
      await mockedMain(["node", "code-slicer"]);

      expect(cli.command).toHaveBeenCalledWith(
        "<file-path>",
        "Collect local dependency files and output their paths and source code",
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
