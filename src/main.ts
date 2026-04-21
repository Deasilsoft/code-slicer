import { cac } from "cac";
import NodePath from "node:path";
import pkg from "../package.json" with { type: "json" };
import { collectDependencyFiles } from "./domains/pipeline/index.js";

export async function main(argv: string[]): Promise<void> {
  const cli = cac("code-slicer");

  cli
    .command(
      "<file-path>",
      "Collect local dependency files and output their paths and source code",
    )
    .action(async (filePath: string) => {
      const files = await collectDependencyFiles(filePath);

      for (const file of files) {
        const relativeFilePath =
          NodePath.relative(process.cwd(), file.filePath) || file.filePath;

        process.stdout.write(`${relativeFilePath}\n`);
        process.stdout.write(`${file.sourceCode}\n\n`);
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
