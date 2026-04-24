import { vi } from "vitest";

export function captureStreams() {
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
