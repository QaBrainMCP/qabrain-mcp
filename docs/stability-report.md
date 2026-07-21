# QaBrain MCP v1.0 Stability Audit & Recommendations (Phase S1)

Date: 2026-07-21

## Executive summary

This audit inspects the repository for MCP protocol compliance, logging behavior, initialization and shutdown, tool registration, error handling, browser lifecycle, async patterns, and potential resource leaks. The codebase is generally well organized and uses typed services, but there are several stability and MCP-compliance issues that should be addressed before deeming the server production-ready.

High-priority issues
- Application logging currently targets stdout (via the `pino` logger). MCP JSON-RPC messages are written to stdout by the `StdioServerTransport`; mixing application logs and MCP messages on stdout will break the MCP protocol.
- Multiple files (CLI helpers, tests, and store initializers) write directly to stdout via `console.log` which can also corrupt the MCP transport.
- Some long-running/async flows don't consistently guard cancellation or timeouts (tool execution harness needs defensive timeouts and cancellation support).

## Audit findings (detailed)

1) Logging and MCP protocol compliance
- File: [src/utils/logger.ts](src/utils/logger.ts#L1-L60)
  - Uses `pino` with `pino-pretty` transport but no explicit destination. By default `pino` writes to stdout. When the server is started with `StdioServerTransport` this will mix logger output with MCP JSON messages on stdout.
  - Recommendation: configure `pino` to write to stderr, or provide an explicit destination (file or `process.stderr`) when running as an MCP server.

- Console usage: many scripts and modules use `console.log` and `console.error` for status and diagnostic output. Notable examples:
  - [src/cli/commands/*](src/cli/commands#L1) — CLI commands print to stdout (acceptable for CLI UX, but must be silenced when running as MCP server).
  - [src/knowledge/store/knowledge-store.service.ts](src/knowledge/store/knowledge-store.service.ts#L60) prints `Repository Loaded` to stdout.
  - Test scripts under `src/test/*` and `dist/*` contain `console.log` and `console.error` calls for debugging and reporting.

2) Initialization & graceful shutdown
- File: [src/cli/commands/start.command.ts](src/cli/commands/start.command.ts#L1-L80)
  - Installs `process.on('SIGINT')` and `SIGTERM` handlers that call `browserManager.close()` then `process.exit(0)`. Good but incomplete: the MCP `Server` instance should be stopped/disconnected as well (SDK offers disconnect APIs in some releases), and other resources (knowledge store flush, open DB/file handles) should be closed.
  - The shutdown handlers call `logger.info` (which currently prints to stdout). That should be written to stderr.

3) Tool registration and execution
- File: [src/mcp/server.ts](src/mcp/server.ts#L1-L240) and [src/mcp/tools.ts](src/mcp/tools.ts#L1-L300)
  - Tool registration uses plugin arrays and `toolRegistry.register()`; registration is centralized and straightforward.
  - The request handler routes MCP `CallToolRequestSchema` to `executeTool(name, args)`, which logs and returns the result wrapped in a `content` array (JSON string). This is compliant with the SDK usage, but requires log outputs to be on stderr.
  - `executeTool` rethrows errors after logging; ensure the SDK transport serializes exceptions into structured MCP errors rather than allowing stray stderr/stdout messages to leak.

4) Error handling and swallowed exceptions
- Many services catch errors and ignore them (e.g. persistence hydration in `knowledge.repository.ts` swallows hydration errors). While this avoids crashes, silent failures can hide data loss.
  - Recommendation: surface non-fatal errors through structured logger with error context and consider fail-fast for critical init steps.

5) Browser lifecycle / resource leaks
- Files: [src/browser/browser.manager.ts](src/browser/browser.manager.ts#L1-L240), [src/browser/page.manager.ts](src/browser/page.manager.ts#L1-L200)
  - Browser and page lifecycle is managed through `browserManager` and `pageManager`. They provide `launch`, `ensurePage`, `closePage`, and `close` methods.
  - Some callers (feature learning and tests) create pages and rely on `pageManager.closePage()` in finally blocks but not all code paths ensure page/context closure on error.
  - Recommendation: add a centralized shutdown sequence that closes pages, contexts, browser, and flushes stores; ensure all tools that open pages register cleanup hooks.

6) Async patterns and timeouts
- Default navigation/operation timeouts are present in `browser.manager.ts` (e.g. `DEFAULT_NAVIGATION_TIMEOUT_MS = 60_000`). Good practice, but tool execution itself does not enforce a maximum runtime — a misbehaving tool could hang indefinitely.
  - Recommendation: enforce tool-level timeouts in the MCP tool dispatcher (`executeTool`) and support cancellation via the MCP SDK where available.

7) Duplicate and stdout-heavy code
- Several CLI helpers and test runners print human-readable summaries to stdout. When running in MCP mode, the server must avoid printing to stdout. Consider separating CLI codepath (human CLI) from MCP server codepath, or gate console output behind an environment flag.

## Tool validation plan (automated)

Objective: automatically exercise every registered MCP tool with valid and invalid payloads and document behavior.

Approach
- Use `toolRegistry.getAll()` to drive tests.
- For each tool `t`:
  - Generate a valid sample input (use tool's `inputSchema` from `registerTools`/`schemaForTool`) and call `t.execute(validInput)` with a timeout.
  - Call `t.execute(invalidInput)` and confirm it throws a structured error.
  - Confirm tools return JSON-serializable results.
- Capture timing and memory usage for each tool.

Notes: tests should mock heavy dependencies (Playwright, network) for tools that interact with browsers.

## Repository validation plan

- Re-run `knowledgeEngineService.learn(application)` multiple times and ensure idempotence: pages/components counts either stable or increment predictably (visitedCount). Scripted tests should assert repository invariants after repeated runs.
- Verify `knowledge-store` persistence does not leak or duplicate entries (use `knowledgeStoreService.searchComponents` and `knowledgeRepository.getPages`).

## Performance observations

- Startup: typical startup sequence involves loading configuration, registering tools, and connecting the MCP server. Measured values depend on environment; no synthetic benchmarks are included in this audit. Instrumentation points should be added to measure `startServer()` time and `executeTool` durations.
- Browser startup: Playwright startup is done per request by `browserManager.launch()` and is potentially slow; recommend keeping a warm browser instance for consecutive tools.

## Error handling review

- Many modules use try/catch and log errors; however:
  - Some catch blocks swallow errors silently (no logging) — this should be reduced.
  - `executeTool` logs errors and rethrows; ensure the MCP transport maps exceptions to MCP JSON-RPC error responses (structured: code, message, data) rather than only printing a stack trace to stderr.

## Recommendations (prioritized)

P0 (must fix before MCP production) — Completed
- [x] Route all application logs to stderr when running as MCP server.
  - Implemented: `createLogger` now routes pino output to `stderr` when `MCP_MODE=true`. See [src/utils/logger.ts](src/utils/logger.ts#L1-L60).
- [x] Remove or silence `console.log` usage that emits to stdout when server is run in MCP mode.
  - Implemented: added `enableMcpMode()` to redirect console output to `stderr` when `MCP_MODE=true`, and replaced direct `console.log` calls in the knowledge store with structured `logger` calls. See [src/utils/mcp-mode.ts](src/utils/mcp-mode.ts) and [src/knowledge/store/knowledge-store.service.ts](src/knowledge/store/knowledge-store.service.ts#L1-L120).
- [x] Ensure the MCP server shutdown sequence closes the MCP `Server` transport, browser, and any store flushes before `process.exit`.
  - Implemented: `QaBrainServer.stop()` attempts graceful `disconnect()`/`close()` on the SDK `Server` if present; `start` command signal handlers now attempt `server.disconnect()` before closing the browser. See [src/mcp/server.ts](src/mcp/server.ts#L1-L240) and [src/cli/commands/start.command.ts](src/cli/commands/start.command.ts#L1-L120).

P1 (high priority) — Completed
- [x] Add tool-level execution timeouts and best-effort cancellation support in `executeTool`.
  - Implemented: `executeTool` wraps `tool.execute()` with a configurable timeout (`TOOL_TIMEOUT_MS`, default 120000ms) and attempts to call `tool.cancel()` if a timeout occurs. See [src/mcp/tools.ts](src/mcp/tools.ts#L1-L200).
- [x] Fail loudly on critical initialization errors (e.g. storage failure) instead of swallowing them; add structured error logs.
  - Implemented: repository bootstrap now logs and rethrows errors when `knowledgeStoreService.load()` fails so startup fails fast. See [src/knowledge/repository/knowledge.repository.ts](src/knowledge/repository/knowledge.repository.ts#L1-L80).
- [x] Add more robust page/context cleanup in `pageManager.closePage()` for error paths.
  - Implemented: `pageManager.closePage()` now catches errors when closing page/context and attempts a deeper browser close on failures. See [src/browser/page.manager.ts](src/browser/page.manager.ts#L1-L120).

P2 (improve reliability and observability) — Completed
- [x] Add instrumentation (timers, memory) around server start and tool execution and emit structured metrics to stderr or a monitoring sink.
  - Implemented: `src/utils/metrics.ts` provides timers and memory snapshot helpers. Server startup and tool execution are instrumented to log metrics. See [src/mcp/server.ts](src/mcp/server.ts#L1-L200) and [src/mcp/tools.ts](src/mcp/tools.ts#L1-L200).
- [x] Create an automated tool-validation harness (tests) that runs every registered tool with mocked dependencies.
  - Implemented: `test/mcp/tool-validation.test.ts` registers core tools, stubs heavy services (pageManager, browserManager, knowledgeStoreService), and exercises tools with minimal valid and invalid inputs.

## Suggested quick fixes (examples)

- Change `createLogger` to direct pino output to `process.stderr` when `process.env.MCP_MODE === 'true'`.
- Introduce `isMcpMode()` helper that is true when running under the MCP server. In MCP mode:
  - Silence `console.log` calls in CLI helpers, or guard them behind `if (!isMcpMode()) console.log(...)`.

## Known issues uncovered
- stdout contamination by application logs (critical)
- Several `console.log` calls in test/CLI code that will confuse MCP transport when run in the same process (medium)
- Missing global shutdown ordering (graceful server disconnect) (medium)
- Lack of tool-level timeouts and cancellation (medium)

## Next steps
1. Apply P0 fixes: route logs to stderr and silence stdout outputs during MCP runtime.
2. Add tool-level timeouts & cancellation support in `executeTool` and add tests that exercise timeouts.
3. Implement graceful shutdown sequence: stop MCP transport, close browser, flush stores, then exit.
4. Add automated tool-validation tests (mock Playwright where necessary).
5. Add basic performance instrumentation.

## Appendix — Important code locations
- Logger: [src/utils/logger.ts](src/utils/logger.ts#L1-L60)
- MCP server and transport init: [src/mcp/server.ts](src/mcp/server.ts#L1-L240)
- MCP tool dispatcher: [src/mcp/tools.ts](src/mcp/tools.ts#L1-L260)
- CLI start & signal handling: [src/cli/commands/start.command.ts](src/cli/commands/start.command.ts#L1-L80)
- Browser manager / page manager: [src/browser/browser.manager.ts](src/browser/browser.manager.ts#L1-L240), [src/browser/page.manager.ts](src/browser/page.manager.ts#L1-L200)
- Knowledge persistence bootstrap: [src/knowledge/repository/knowledge.repository.ts](src/knowledge/repository/knowledge.repository.ts#L1-L120)
