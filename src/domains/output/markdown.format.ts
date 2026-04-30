import type { ModuleFile } from "../pipeline/types.js";
import { getRelativeFilePath } from "./utils.js";

export function renderMarkdown(files: ModuleFile[]): string {
  return files
    .map((file) => {
      const relativeFilePath = getRelativeFilePath(file.filePath);
      const fence = getMarkdownCodeFence(file.sourceCode);

      return [
        `### ${relativeFilePath}`,
        "",
        fence,
        file.sourceCode,
        fence,
      ].join("\n");
    })
    .join("\n\n");
}

function getMarkdownCodeFence(sourceCode: string): string {
  let longestRun = 0;

  for (const run of sourceCode.match(/`+/g) ?? []) {
    longestRun = Math.max(longestRun, run.length);
  }

  return "`".repeat(Math.max(3, longestRun + 1));
}
