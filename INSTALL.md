# Installation

## Requirements

- Node.js 22 or newer
- npm 10 or newer

## Clone and install

```bash
git clone https://github.com/QaBrainMCP/qabrain-mcp.git
cd qabrain-mcp
npm install
```

## Environment setup

Copy the example environment file and adjust it for your machine:

```bash
cp .env.example .env
```

The environment file supports:

- NODE_ENV
- LOG_LEVEL
- BROWSER
- HEADLESS
- MCP_PORT
- MCP_HOST
- APP_NAME
- APP_VERSION
- ENABLE_DEBUG

## Build

```bash
npm run build
```

## Run

```bash
npm start
```

## Test

```bash
npm test
```

## Lint

```bash
npm run lint
```

## Troubleshooting

- If Playwright cannot launch a browser, ensure the browser runtime is installed for your platform.
- If the server fails to start, inspect the startup error message and verify the values in .env.
- If you see TypeScript errors, run `npm run build` and fix the reported issues before contributing.
