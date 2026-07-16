import { Locator, Page } from "playwright";
import { Component, ComponentType } from "../models/component.model.js";

export interface DiscoveredComponents {
    buttons: Component[];
    links: Component[];
    inputs: Component[];
    dropdowns: Component[];
    forms: Component[];
    tables: Component[];
    dialogs: Component[];
}

export class ComponentDiscoveryService {
    async discover(page: Page): Promise<DiscoveredComponents> {
        const [buttons, links, inputs, dropdowns, forms, tables, dialogs] = await Promise.all([
            this.discoverTextComponents(page.locator("button"), "button", "button"),
            this.discoverTextComponents(page.locator("a"), "link", "a"),
            this.discoverInputComponents(page.locator("input, textarea")),
            this.discoverNamedComponents(page.locator("select"), "dropdown", "select"),
            this.discoverNamedComponents(page.locator("form"), "form", "form"),
            this.discoverNamedComponents(page.locator("table"), "table", "table"),
            this.discoverNamedComponents(page.locator("dialog, [role='dialog']"), "dialog", "dialog")
        ]);

        return { buttons, links, inputs, dropdowns, forms, tables, dialogs };
    }

    private async discoverTextComponents(
        locator: Locator,
        type: "button" | "link",
        selector: string
    ): Promise<Component[]> {
        const names = await locator.allTextContents();
        return names.map((name, index) => this.component(type, name || `${type} ${index + 1}`, selector));
    }

    private async discoverInputComponents(locator: Locator): Promise<Component[]> {
        const inputs = await locator.all();
        return Promise.all(inputs.map(async (input, index) => {
            const name = await this.readName(input, `Input ${index + 1}`);
            return this.component("input", name, "input, textarea");
        }));
    }

    private async discoverNamedComponents(
        locator: Locator,
        type: Exclude<ComponentType, "button" | "link" | "input">,
        selector: string
    ): Promise<Component[]> {
        const components = await locator.all();
        return Promise.all(components.map(async (component, index) =>
            this.component(type, await this.readName(component, `${type} ${index + 1}`), selector)
        ));
    }

    private async readName(locator: Locator, fallback: string): Promise<string> {
        return (await locator.getAttribute("aria-label"))
            ?? (await locator.getAttribute("placeholder"))
            ?? (await locator.getAttribute("name"))
            ?? fallback;
    }

    private component(type: ComponentType, name: string, selector: string): Component {
        return { type, name: name.trim(), selector };
    }
}

export const componentDiscoveryService = new ComponentDiscoveryService();
