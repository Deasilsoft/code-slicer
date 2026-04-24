import type { ModuleFile } from "../pipeline/types.js";
import { getRelativeFilePath } from "./utils.js";

export function renderMarkdown(files: ModuleFile[]): string {
  return files
    .map((file) => {
      const relativeFilePath = getRelativeFilePath(file.filePath);
      const fence = getMarkdownFence(file.sourceCode);

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

function getMarkdownFence(sourceCode: string): string {
  const backtickRuns = sourceCode.match(/`+/g) ?? [];
  const longestRun = backtickRuns.reduce(
    (max, run) => Math.max(max, run.length),
    0,
  );

  return "`".repeat(Math.max(3, longestRun + 1));
}
