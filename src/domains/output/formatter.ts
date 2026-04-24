import type { ModuleFile } from "../pipeline/types.js";
import { renderHtml } from "./html.format.js";
import { renderMarkdown } from "./markdown.format.js";
import { renderPlain } from "./plain.format.js";
import { renderXml } from "./xml.format.js";

const RENDERERS = {
  plain: renderPlain,
  markdown: renderMarkdown,
  html: renderHtml,
  xml: renderXml,
} as const;

type OutputFormat = keyof typeof RENDERERS;

const SUPPORTED_OUTPUT_FORMATS = Object.keys(RENDERERS) as OutputFormat[];

export function renderCollectedFiles(
  files: ModuleFile[],
  format: string | undefined,
): string {
  return RENDERERS[toOutputFormat(format)](files);
}

function toOutputFormat(format: string | undefined): OutputFormat {
  const normalizedFormat = format ?? "plain";

  if (isOutputFormat(normalizedFormat)) {
    return normalizedFormat;
  }

  throw new Error(
    `Unsupported output format: ${format}. Supported formats: ${SUPPORTED_OUTPUT_FORMATS.join(", ")}`,
  );
}

function isOutputFormat(format: string): format is OutputFormat {
  return SUPPORTED_OUTPUT_FORMATS.includes(format as OutputFormat);
}
