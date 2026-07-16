import { describe, expect, it } from "vitest";
import { ToolRegistry } from "./tool.registry.js";

describe("ToolRegistry", () => {
    it("registers and retrieves tools", () => {
        const registry = new ToolRegistry();
        const tool = {
            name: "example_tool",
            description: "Example tool",
            execute: async () => ({ ok: true })
        };

        registry.register(tool);

        expect(registry.get("example_tool")).toBe(tool);
        expect(registry.getAll()).toEqual([tool]);
    });
});
