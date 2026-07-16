import { Page } from "playwright";
import { describe, expect, it } from "vitest";
import { ComponentDiscoveryService } from "./component-discovery.service.js";

function locator(text: string[] = [], names: string[] = []) {
    return {
        allTextContents: async () => text,
        all: async () => names.map(name => ({
            getAttribute: async (attribute: string) => attribute === "placeholder" ? name : null
        }))
    };
}

describe("ComponentDiscoveryService", () => {
    it("discovers supported application components", async () => {
        const page = {
            locator: (selector: string) => {
                if (selector === "button") return locator(["Login"]);
                if (selector === "a") return locator(["Forgot password"]);
                if (selector === "input, textarea") return locator([], ["Username", "Password"]);
                if (selector === "select") return locator([], ["Country"]);
                if (selector === "form") return locator([], ["Login form"]);
                if (selector === "table") return locator([], ["Users"]);
                return locator([], ["Confirmation"]);
            }
        } as unknown as Page;

        const components = await new ComponentDiscoveryService().discover(page);

        expect(components.buttons[0].name).toBe("Login");
        expect(components.links[0].name).toBe("Forgot password");
        expect(components.inputs.map(input => input.name)).toEqual(["Username", "Password"]);
        expect(components.dropdowns[0].name).toBe("Country");
        expect(components.forms).toHaveLength(1);
        expect(components.tables).toHaveLength(1);
        expect(components.dialogs).toHaveLength(1);
    });
});
