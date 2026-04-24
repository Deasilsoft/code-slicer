import type { ModuleFile } from "../pipeline/types.js";
import { escapeXml, getRelativeFilePath } from "./utils.js";

export function renderXml(files: ModuleFile[]): string {
  const fileNodes = files
    .map((file) => {
      const relativeFilePath = getRelativeFilePath(file.filePath);
      const escapedFilePath = escapeXml(relativeFilePath);
      const escapedSourceCode = escapeXml(file.sourceCode);

      return [
        `  <file path="${escapedFilePath}">`,
        `    <source>${escapedSourceCode}</source>`,
        "  </file>",
      ].join("\n");
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    "<files>",
    fileNodes,
    "</files>",
  ].join("\n");
}
