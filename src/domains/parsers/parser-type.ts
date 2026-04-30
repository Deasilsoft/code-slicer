import NodePath from "node:path";

type ParserType = "javascript" | "typescript" | "vue" | "unknown";

export function getParserType(filePath: string): ParserType {
  switch (NodePath.extname(filePath).toLowerCase()) {
    case ".js":
    case ".mjs":
    case ".cjs":
    case ".jsx": {
      return "javascript";
    }
    case ".ts":
    case ".mts":
    case ".cts":
    case ".tsx": {
      return "typescript";
    }
    case ".vue": {
      return "vue";
    }
    default: {
      return "unknown";
    }
  }
}
