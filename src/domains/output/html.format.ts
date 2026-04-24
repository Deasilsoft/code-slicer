import type { ModuleFile } from "../pipeline/types.js";
import { escapeXml, getRelativeFilePath } from "./utils.js";

export function renderHtml(files: ModuleFile[]): string {
  const sections = files
    .map((file) => {
      const relativeFilePath = getRelativeFilePath(file.filePath);
      const escapedFilePath = escapeXml(relativeFilePath);
      const escapedSourceCode = escapeXml(file.sourceCode);

      return [
        '<section class="code-slicer-file">',
        `  <h3>${escapedFilePath}</h3>`,
        `  <pre><code>${escapedSourceCode}</code></pre>`,
        `</section>`,
      ].join("\n");
    })
    .join("\n");

  return [
    "<!DOCTYPE html>",
    '<html lang="en">',
    "<head>",
    '  <meta charset="UTF-8">',
    "  <title>code-slicer output</title>",
    "</head>",
    "<body>",
    '  <main class="code-slicer-output">',
    sections
      .split("\n")
      .map((line) => `    ${line}`)
      .join("\n"),
    "  </main>",
    "</body>",
    "</html>",
  ].join("\n");
}
