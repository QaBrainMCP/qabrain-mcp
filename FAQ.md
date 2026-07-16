# FAQ

## What is QaBrainMCP?

QaBrainMCP is an MCP server for QA automation that helps teams capture application knowledge, map requirements, analyze coverage, and reason about missing test scenarios.

## How is it different from Playwright?

Playwright is a browser automation framework. QaBrainMCP builds on top of that idea by adding reusable QA intelligence, requirement mapping, knowledge graph analysis, and MCP-based tool integration.

## How do I add a new MCP tool?

1. Implement the tool handler in the appropriate domain folder under src.
2. Register the tool in the MCP tool registry.
3. Add a corresponding MCP wrapper under src/mcp/tools.
4. Update this documentation and any related examples.

## How does the Knowledge Graph work?

The knowledge graph connects pages, components, locators, workflows, and snapshots so that queries and reasoning can traverse relationships across the application model.

## How do I debug the application?

Use the environment-driven logger settings in .env to increase verbosity, and inspect startup errors emitted by the application entry point.
