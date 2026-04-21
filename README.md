# code-slicer

[![npm version](https://img.shields.io/npm/v/code-slicer)](https://www.npmjs.com/package/code-slicer)
[![Code Quality](https://github.com/Deasilsoft/code-slicer/actions/workflows/code-quality.yml/badge.svg?branch=main)](https://github.com/Deasilsoft/code-slicer/actions/workflows/code-quality.yml)
[![codecov](https://codecov.io/gh/Deasilsoft/code-slicer/graph/badge.svg)](https://codecov.io/gh/Deasilsoft/code-slicer)

Extract minimal, dependency-aware code context from an entry file for use in AI prompts.

`code-slicer` is a CLI that traverses local imports from an entry file and outputs relevant code in dependency order.
Built for AI workflows where precise context matters more than full repository dumps.

## Quickstart

### Installation

```bash
npm install --save-dev code-slicer
```

### Usage

```bash
code-slicer <entry-file>
```

### Example

```bash
code-slicer src/entrypoint.ts
```

## What it does

- Starts from a single entry file
- Follows local imports and dependencies
- Outputs files in dependency order
- Includes full source code for each file
- Excludes external packages and unresolved modules

## Output format

```
relative/path/to/file.ts
<source code>

relative/path/to/another-file.ts
<source code>
```

Each file is printed as:

1. Relative path
2. Source code
3. Blank line

## Constraints

- Only local file dependencies are included
- `node_modules` is ignored
- No bundling or code transformation
- No runtime evaluation
- Output is deterministic and file-based

## Requirements

- Node.js >= 22

## How it works

1. Parse the entry file using the TypeScript AST
2. Extract imports (`import`, `export ... from`, `import()`)
3. Resolve modules using TypeScript resolution with fallback logic
4. Recursively traverse dependencies
5. Cache file reads and resolution results
6. Skip external and unresolved modules

## Use cases

- AI prompt generation with relevant code context
- Dependency inspection
- Minimal reproduction cases
- Code review context extraction

## Development

```bash
npm run dev
npm run build
npm run typecheck
npm run lint
npm run format
```

## Contributing

### Principles

- Domain-Driven Design (DDD)
- Clean Code:
    - Small, focused functions
    - Explicit naming
    - No hidden side effects
    - Clear separation of concerns

### Expectations

- Keep changes minimal and intentional
- Avoid unnecessary abstractions
- Preserve deterministic behavior

## License

MIT
