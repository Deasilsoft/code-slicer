import { cac } from "cac";
import NodePath from "node:path";
import pkg from "../package.json" with { type: "json" };
import { collectFilesFromEntry } from "./domains/modules/index.js";

export async function main(argv: string[]): Promise<void> {
  const cli = cac("code-slicer");

  cli
    .command(
      "<file-path>",
      "Extract dependency-aware code context from an entry file",
    )
    .action(async (filePath: string) => {
      const moduleFiles = await collectFilesFromEntry(filePath);

      for (const moduleFile of moduleFiles) {
        const relativeFilePath =
          NodePath.relative(process.cwd(), moduleFile.filePath) ||
          moduleFile.filePath;

        process.stdout.write(`${relativeFilePath}\n`);
        process.stdout.write(`${moduleFile.sourceCode}\n\n`);
      }
    });

  cli.help();
  cli.version(pkg.version);

  if (argv.length <= 2) {
    cli.outputHelp();

    return;
  }

  cli.parse(argv, { run: false });

  await cli.runMatchedCommand();
}
