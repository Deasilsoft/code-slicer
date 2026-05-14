import { cac } from "cac";
import pkg from "../package.json" with { type: "json" };
import { renderCollectedFiles } from "./domains/output/formatter.js";
import { collectDependencyFiles } from "./domains/pipeline/index.js";

export async function main(argv: string[]): Promise<void> {
  const cli = cac("code-slicer");

  cli
    .command(
      "<file-path>",
      "Collect local dependency files and output them in the selected format",
    )
    .option("--format <format>", "Output format (plain, markdown, html, xml)", {
      default: "plain",
    })
    .option("-p, --project <path>", "Path to tsconfig.json")
    .action(
      async (
        filePath: string,
        options: { format?: string; project?: string },
      ) => {
        const files = await collectDependencyFiles(filePath, options.project);
        const output = renderCollectedFiles(files, options.format);

        process.stdout.write(`${output}\n`);
      },
    );

  cli.help();
  cli.version(pkg.version);

  if (argv.length <= 2) {
    cli.outputHelp();

    return;
  }

  cli.parse(argv, { run: false });

  await cli.runMatchedCommand();
}
