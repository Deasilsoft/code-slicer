import * as NodeFS from "node:fs/promises";

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await NodeFS.access(filePath);

    return true;
  } catch {
    return false;
  }
}

export async function readFile(filePath: string): Promise<string> {
  return NodeFS.readFile(filePath, "utf8");
}
