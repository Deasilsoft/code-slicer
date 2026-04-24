import NodePath from "node:path";

export function getRelativeFilePath(filePath: string): string {
  return NodePath.relative(process.cwd(), filePath);
}

export function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
