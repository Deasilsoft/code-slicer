import * as NodeFS from "node:fs/promises";

const fileContentsCache = new Map<string, string>();

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await NodeFS.access(filePath);

    return true;
  } catch {
    return false;
  }
}

export async function readFile(filePath: string): Promise<string> {
  const cachedFileContents = fileContentsCache.get(filePath);

  if (cachedFileContents !== undefined) {
    return cachedFileContents;
  }

  const fileContents = await NodeFS.readFile(filePath, "utf8");

  fileContentsCache.set(filePath, fileContents);

  return fileContents;
}
