import { describe, expect, it } from "vitest";
import { ApplicationSnapshot } from "../models/snapshot.model.js";
import { DiffService } from "./diff.service.js";

function snapshot(id: string, components: string[], locators: string[]): ApplicationSnapshot {
    return {
        id, application: "Playwright",
        pages: [{ title: "Login", url: "/login", components, locators }],
        workflows: [{ name: "Login Flow", pages: ["Login"], actions: ["Open"], locators }],
        createdAt: new Date()
    };
}

describe("DiffService", () => {
    it("detects page, component, locator, and workflow changes", () => {
        const changes = new DiffService().compare(
            snapshot("first", ["Username"], ["Username"]),
            snapshot("second", ["Username", "Remember Me Checkbox"], ["Username", "Remember Me"])
        );

        expect(changes).toContainEqual({ type: "UPDATED_PAGE", page: "Login" });
        expect(changes).toContainEqual({ type: "NEW_COMPONENT", page: "Login", component: "Remember Me Checkbox" });
        expect(changes).toContainEqual({ type: "NEW_LOCATOR", page: "Login", locator: "Remember Me" });
        expect(changes).toContainEqual({ type: "UPDATED_WORKFLOW", workflow: "Login Flow" });
    });
});
