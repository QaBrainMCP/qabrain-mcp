# Contributing

## Getting started

1. Fork the repository.
2. Create a feature branch from main.
3. Install dependencies with `npm install`.
4. Copy `.env.example` to `.env` and adjust values as needed.
5. Run `npm run build` and `npm test` before opening a pull request.

## Branch strategy

- Use `main` for release-ready code.
- Create short-lived topic branches such as `fix/config-validation` or `docs/readme-refresh`.

## Coding standards

- Keep TypeScript strict and avoid introducing new runtime dependencies unless necessary.
- Do not change business logic while working on docs or developer-experience tasks.
- Prefer small, focused changes with clear intent.

## Commit message format

Use concise, descriptive messages such as:

- `docs: refresh installation guide`
- `fix: tighten configuration validation`
- `test: add regression coverage for QA report`

## Pull request process

- Open a pull request with a clear summary of the change.
- Include the relevant test/build evidence.
- Respond to review comments promptly.

## Code review checklist

- Documentation matches implementation.
- New code does not introduce regressions.
- Tests and build remain green.
- Error messages are clear and actionable.

## Testing requirements

- Run `npm run build`.
- Run `npm test`.
- Add or update regression tests when fixing behavior.
