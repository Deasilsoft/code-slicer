import type TypeScript from "typescript";

export type ModuleFile = {
  filePath: string;
  sourceCode: string;
};

export type CollectionContext = {
  compilerOptions: TypeScript.CompilerOptions;
  files: ModuleFile[];
  visitedFilePaths: Set<string>;
};
