import NodePath from "node:path";

export type ParserType = "javascript" | "typescript" | "unknown";

export function getParserType(filePath: string): ParserType {
  switch (NodePath.extname(filePath).toLowerCase()) {
    case ".js":
    case ".mjs":
    case ".cjs":
    case ".jsx":
      return "javascript";
    case ".ts":
    case ".mts":
    case ".cts":
    case ".tsx":
      return "typescript";
    default:
      return "unknown";
  }
}
