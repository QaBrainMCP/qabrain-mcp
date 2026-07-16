# GitHub Actions workflows

These workflows are intended to provide deterministic CI/CD automation for QaBrainMCP.

- build.yml: validates the production build on push and pull requests.
- lint.yml: runs typecheck, ESLint, and formatting validation.
- test.yml: runs the test suite and enforces a coverage gate.
- release.yml: validates the version format, builds a package, and prepares a draft release.
- security.yml: performs dependency auditing.
