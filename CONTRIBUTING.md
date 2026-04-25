# Contributing

This document defines how to contribute to `code-slicer`.

## Workflow

Use a simple flow: **Issue → PR to `main`**.

1. Open or discuss an issue before non-trivial changes.
2. Create a focused branch or fork.
3. Open a PR to `main` and link the issue.

Small fixes do not require an issue. Discuss larger changes before implementation.

## Local setup and checks

Requirements:

- Node.js >= 22

Run the same checks as CI, in this order:

```bash
npm ci
npm run format:check
npm run lint
npm run typecheck
npm run knip
npm test
npm run build
```

If you experience issues with `npm ci`:

```bash
npm run clean:install
```

## Code expectations

- Prefer minimal, intentional solutions over broad refactors.
- Keep behavior deterministic and file-based.
- Keep domain boundaries explicit.
- Use clear names, small functions, and explicit interfaces.
- Remove meaningful duplication without over-generalizing.
- Add abstractions only when they solve recurring problems.
- Add or update tests for behavior changes, including key edge cases.
- Keep tests readable and focused on outcomes.

## Commit style

Use concise, conventional commit-style messages where practical:

```text
feat: add Vue SFC traversal
fix: resolve extension fallback handling
docs: add contributing guide
```

## Pull requests

GitHub auto-loads the PR checklist from `.github/pull_request_template.md`.
Complete that template when opening or updating a PR.

## Review focus

Maintainers review for correctness, simplicity, test quality, and alignment with project expectations.
