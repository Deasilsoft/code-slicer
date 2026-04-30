# code-slicer

[![npm version](https://img.shields.io/npm/v/code-slicer)](https://www.npmjs.com/package/code-slicer)
[![Code Quality](https://github.com/Deasilsoft/code-slicer/actions/workflows/code-quality.yml/badge.svg?branch=main)](https://github.com/Deasilsoft/code-slicer/actions/workflows/code-quality.yml)
[![Code Coverage](https://codecov.io/gh/Deasilsoft/code-slicer/graph/badge.svg)](https://codecov.io/gh/Deasilsoft/code-slicer)
[![Socket](https://badge.socket.dev/npm/package/code-slicer)](https://socket.dev/npm/package/code-slicer)

Extract minimal, dependency-aware code context from an entry file for use in AI
prompts.

`code-slicer` is a CLI that traverses local imports from an entry file and
outputs relevant code in traversal order. It is designed for AI workflows where
precise context matters more than full repository dumps.

## Quickstart

### Installation

```bash
npm install --save-dev code-slicer
```

### Usage

```bash
code-slicer <entry-file>
```

```bash
code-slicer <entry-file> --format <plain|markdown|html|xml>
```

### Example

```bash
code-slicer src/bin.ts
```

## What it does

- Starts from a single entry file
- Follows local imports and dependencies
- Supports JavaScript, TypeScript, JSX, TSX, React, and Vue
- Outputs files in traversal order
- Includes full source code for each file
- Excludes external packages and unresolved modules

## Output formats

Supported formats:

- `plain` (default)
- `markdown`
- `html`
- `xml`

### Plain (default)

```bash
code-slicer src/bin.ts
```

```text
relative/path/to/file.ts
<source code>

relative/path/to/another-file.ts
<source code>
```

### Markdown

```bash
code-slicer src/bin.ts --format markdown
```

````text
### relative/path/to/file.ts

```
<source code>
```

### relative/path/to/another-file.ts

```
<source code>
```
````

### HTML

```bash
code-slicer src/bin.ts --format html
```

```text
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>code-slicer output</title>
</head>
<body>
  <main class="code-slicer-output">
    <section class="code-slicer-file">
      <h3>relative/path/to/file.ts</h3>
      <pre><code>&lt;source code&gt;</code></pre>
    </section>
  </main>
</body>
</html>
```

### XML

```bash
code-slicer src/bin.ts --format xml
```

```text
<?xml version="1.0" encoding="UTF-8"?>
<files>
  <file path="relative/path/to/file.ts">
    <source>&lt;source code&gt;</source>
  </file>
</files>
```

## Constraints

- Only local file dependencies are included
- `node_modules` is ignored
- No bundling or code transformation
- No runtime evaluation
- Output is deterministic and file-based

## Requirements

- Node.js >= 22

## How it works

1. Detect file type (JavaScript, TypeScript, Vue)
2. Parse source
   - TypeScript AST for JS/TS/JSX/TSX
   - Vue SFC parser for `.vue` files
3. Extract imports (`import`, `export ... from`, `import()`)
4. Resolve modules using TypeScript resolution with fallback logic
5. Recursively traverse dependencies
6. Track visited files to avoid cycles
7. Skip external and unresolved modules

## Use cases

- AI prompt generation with relevant code context
- Dependency inspection
- Minimal reproduction cases
- Code review context extraction

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for process, standards, and testing
expectations.

## License

MIT
