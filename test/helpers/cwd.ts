export async function withWorkingDirectory(
  directoryPath: string,
  run: () => Promise<void>,
): Promise<void> {
  const previousWorkingDirectory = process.cwd();
  process.chdir(directoryPath);

  try {
    await run();
  } finally {
    process.chdir(previousWorkingDirectory);
  }
}
