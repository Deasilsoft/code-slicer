import NodePath from "node:path";
import TypeScript from "typescript";

export function getCompilerOptions(
  fromFilePath: string,
  projectFilePath?: string,
): TypeScript.CompilerOptions {
  const configFilePath = projectFilePath
    ? NodePath.resolve(projectFilePath)
    : TypeScript.findConfigFile(
        NodePath.dirname(fromFilePath),
        TypeScript.sys.fileExists,
        "tsconfig.json",
      );

  if (!configFilePath) {
    return {};
  }

  const configFile = TypeScript.readConfigFile(
    configFilePath,
    TypeScript.sys.readFile,
  );

  if (configFile.error) {
    throw new Error(
      TypeScript.flattenDiagnosticMessageText(
        configFile.error.messageText,
        "\n",
      ),
    );
  }

  const parsedConfig = TypeScript.parseJsonConfigFileContent(
    configFile.config,
    TypeScript.sys,
    NodePath.dirname(configFilePath),
  );

  return parsedConfig.options;
}
