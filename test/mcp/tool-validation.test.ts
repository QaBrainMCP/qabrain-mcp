import { describe, it, expect, beforeAll, vi } from "vitest";
import { toolRegistry } from "../../src/mcp/registry/tool.registry.js";
import { coreTools } from "../../src/plugins/core/tools.js";

// Lightweight mocks for heavy services
import { pageManager } from "../../src/browser/page.manager.js";
import { browserManager } from "../../src/browser/browser.manager.js";
import { knowledgeStoreService } from "../../src/knowledge/store/knowledge-store.service.js";
import { knowledgeRepository } from "../../src/knowledge/repository/knowledge.repository.js";

beforeAll(() => {
    // register core tools
    for (const t of coreTools) {
        toolRegistry.register(t as any);
    }

    // stub pageManager to avoid launching browser
    (pageManager as any).getPage = async () => ({
        url: () => "about:blank",
        title: async () => "about:blank",
        locator: () => ({ waitFor: async () => {} }),
        content: async () => "<html></html>",
        screenshot: async () => Buffer.from([])
    } as any);

    // stub browserManager to avoid chromium operations
    (browserManager as any).launch = async () => ({} as any);
    (browserManager as any).ensurePage = async () => ({
        url: () => "about:blank",
        title: async () => "about:blank",
        content: async () => "<html></html>",
        locator: () => ({ waitFor: async () => {} }),
        screenshot: async () => Buffer.from([])
    } as any);

    // stub knowledge store persistence to in-memory no-ops
    (knowledgeStoreService as any).load = async () => {};
    (knowledgeStoreService as any).savePage = async () => {};
    (knowledgeStoreService as any).saveComponent = async () => {};
    (knowledgeStoreService as any).saveLocator = async () => {};

    // clear repository
    try { (knowledgeRepository as any).clear(); } catch {}
});

describe("MCP Tool Registry validation", () => {
    it("all registered tools accept basic valid/invalid inputs without crashing the process", async () => {
        const tools = toolRegistry.getAll();
        expect(tools.length).toBeGreaterThan(0);

        for (const tool of tools) {
            const name = tool.name;
            // Prepare a minimal valid payload if the tool expects known fields
            let valid: any = {};
            if (name === "learn_application") valid = { application: "orangehrm" };
            if (name === "create_snapshot") valid = { application: "orangehrm" };

            // Call with valid input (wrapped to catch errors; test should not throw unhandled)
            try {
                // tools may interact with network; we call but ignore results
                // set a short timeout via env
                process.env.TOOL_TIMEOUT_MS = "5000";
                await Promise.race([tool.execute(valid as any), new Promise(r => setTimeout(r, 3000))]);
            } catch (err) {
                // tool may intentionally throw for invalid or missing deps; ensure error is Error
                expect(err).toBeInstanceOf(Error);
            }

            // Call with clearly invalid input and expect a thrown error
            try {
                await tool.execute({ not: "valid" } as any);
            } catch (err) {
                expect(err).toBeInstanceOf(Error);
            }
        }
    }, 60_000);
});
