import type { ModuleFile } from "../pipeline/types.js";
import { getRelativeFilePath } from "./utils.js";

export function renderPlain(files: ModuleFile[]): string {
  return files
    .map((file) => {
      const relativeFilePath = getRelativeFilePath(file.filePath);

      return `${relativeFilePath}\n${file.sourceCode}`;
    })
    .join("\n\n");
}
