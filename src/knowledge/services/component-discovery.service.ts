import { Locator, Page } from "playwright";
import {
    Component,
    ComponentRelationship,
    ComponentType
} from "../models/component.model.js";
import { logger } from "../../utils/logger.js";
import { locatorEngineService } from "../../locator/services/locator.engine.service.js";
import { ElementContext } from "../../locator/models/element-context.model.js";
import { StepAnalysis } from "../../ai/reasoning/step-analysis.js";
import { discoveryProfileResolver } from "./discovery-profile-resolver.service.js";

const COMPONENT_DISCOVERY_TIMEOUT_MS = 60_000;
const CONTENT_PREVIEW_LENGTH = 1_000;

const DEBUG_SELECTORS = [
    "button",
    "a",
    "input",
    "textarea",
    "select",
    "form",
    "table",
    "dialog",
    "[role='button']",
    "[role='link']",
    "[role='textbox']",
    "[role='combobox']",
    "[role='dialog']"
] as const;

interface SkippedSummary {
    hidden: number;
    error: number;
}

interface PageStructureSummary {
    headings: string[];
    navigation: string[];
    menus: string[];
    cards: string[];
    tabs: string[];
    breadcrumbs: string[];
    modals: string[];
    tables: string[];
    forms: string[];
    navigationTargets: string[];
}

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

    async discover(page: Page, analysis?: StepAnalysis): Promise<DiscoveredComponents> {
        logger.info({ url: page.url() }, "Component discovery started");

        try {
            const startedAt = Date.now();
            await this.logDebugContext(page);

            await page.waitForLoadState("domcontentloaded", {
                timeout: COMPONENT_DISCOVERY_TIMEOUT_MS
            });
            await page.locator("body").first().waitFor({
                state: "visible",
                timeout: COMPONENT_DISCOVERY_TIMEOUT_MS
            });

            await this.waitForRenderedDom(page);

            const totalDomElements = await page.locator("*").count();
            const selectorCounts = await this.countSelectors(page);
            const pageStructure = await this.capturePageStructure(page);
            const skipped: SkippedSummary = { hidden: 0, error: 0 };

            logger.info(
                {
                    title: await page.title(),
                    url: page.url(),
                    selectorCounts
                },
                "Selector counts before filtering"
            );

            let buttons: Component[] = [];
            let links: Component[] = [];
            let inputs: Component[] = [];
            let dropdowns: Component[] = [];
            let forms: Component[] = [];
            let tables: Component[] = [];
            let dialogs: Component[] = [];

            // Resolve discovery profile based on action type
            const profile = discoveryProfileResolver.resolve(analysis?.actionType ?? analysis?.businessIntent);

            const include = new Set(profile.include);

            // If expectedComponents provided, prefer focused discovery for those names
            if (analysis && analysis.expectedComponents && analysis.expectedComponents.length > 0) {
                const focused = await this.discoverFocused(page, analysis, skipped);
                // merge focused results only for types in profile
                if (include.has("buttons")) buttons = focused.buttons;
                if (include.has("links")) links = focused.links;
                if (include.has("inputs") || include.has("textboxes")) inputs = focused.inputs;
                // dropdowns/forms/tables/dialogs left empty unless profile requests broader discovery
            }

            // Non-focused discovery limited by profile
            if (include.has("buttons") && buttons.length === 0) buttons = await this.discoverButtons(page, skipped);
            if (include.has("links") && links.length === 0) links = await this.discoverLinks(page, skipped);
            if ((include.has("inputs") || include.has("textboxes")) && inputs.length === 0) inputs = await this.discoverInputs(page, skipped);
            if (include.has("dropdowns")) dropdowns = await this.discoverNamed(page, page.locator("select"), "dropdown", skipped);
            if (include.has("forms")) forms = await this.discoverNamed(page, page.locator("form"), "form", skipped);
            if (include.has("tables") || include.has("tableHeaders")) tables = await this.discoverNamed(page, page.locator("table"), "table", skipped);
            if (include.has("dialogs")) dialogs = await this.discoverNamed(page, page.locator("dialog,[role='dialog']"), "dialog", skipped);

            const discoveredByType = {
                buttons: buttons.length,
                links: links.length,
                inputs: inputs.length,
                dropdowns: dropdowns.length,
                forms: forms.length,
                tables: tables.length,
                dialogs: dialogs.length
            };
            const durationMs = Date.now() - startedAt;

            logger.info(
                {
                    url: page.url(),
                    counts: discoveredByType,
                    selectorCounts,
                    diagnostics: {
                        durationMs,
                        totalDomElements,
                        discoveredByType,
                        skippedComponents: skipped
                    },
                    pageStructure
                },
                "Component discovery completed"
            );

            return {
                buttons,
                links,
                inputs,
                dropdowns,
                forms,
                tables,
                dialogs
            };
        } catch (error) {
            logger.error({ err: error, url: page.url() }, "Component discovery failed");
            throw error;
        }
    }

    private async capturePageStructure(page: Page): Promise<PageStructureSummary> {
        const [
            headings,
            navigation,
            menus,
            cards,
            tabs,
            breadcrumbs,
            modals,
            tables,
            forms,
            navigationTargets
        ] = await Promise.all([
            this.collectLabels(page.locator("h1,h2,h3,h4,h5,h6"), 12),
            this.collectLabels(page.locator("nav,[role='navigation']"), 10),
            this.collectLabels(page.locator("[role='menu'],.oxd-main-menu,[class*='menu']"), 12),
            this.collectLabels(page.locator(".orangehrm-dashboard-widget,.oxd-sheet,[class*='card']"), 12),
            this.collectLabels(page.locator("[role='tab'],[class*='tab']"), 12),
            this.collectLabels(page.locator("[aria-label*='breadcrumb' i],[class*='breadcrumb']"), 12),
            this.collectLabels(page.locator("dialog,[role='dialog'],.oxd-dialog-container"), 12),
            this.collectLabels(page.locator("table,[role='table']"), 12),
            this.collectLabels(page.locator("form"), 12),
            this.collectAttribute(page.locator("nav a[href], [role='navigation'] a[href]"), "href", 20)
        ]);

        return {
            headings,
            navigation,
            menus,
            cards,
            tabs,
            breadcrumbs,
            modals,
            tables,
            forms,
            navigationTargets
        };
    }

    private async collectLabels(locator: Locator, maxItems: number): Promise<string[]> {
        const count = await locator.count();
        const labels: string[] = [];

        for (let i = 0; i < Math.min(count, maxItems); i++) {
            const item = locator.nth(i);
            const label = await this.readName(item, `Item ${i + 1}`);
            labels.push(label);
        }

        return this.unique(labels);
    }

    private async collectAttribute(locator: Locator, attribute: string, maxItems: number): Promise<string[]> {
        const count = await locator.count();
        const values: string[] = [];

        for (let i = 0; i < Math.min(count, maxItems); i++) {
            const value = (await locator.nth(i).getAttribute(attribute))?.trim();
            if (value) {
                values.push(value);
            }
        }

        return this.unique(values);
    }

    private async logDebugContext(page: Page): Promise<void> {
        const title = await page.title();
        const url = page.url();
        const content = await page.content();
        const frameEntries = page.frames().map(frame => ({
            name: frame.name(),
            url: frame.url()
        }));
        const iframeCount = await page.locator("iframe").count();
        const shadowHostCount = await page.evaluate(() =>
            Array.from(document.querySelectorAll("*")).filter(element => (element as Element).shadowRoot).length
        );

        logger.info(
            {
                title,
                url,
                htmlSize: content.length,
                contentPreview: content.slice(0, CONTENT_PREVIEW_LENGTH),
                frameCount: frameEntries.length,
                frames: frameEntries,
                iframeCount,
                hasIframes: iframeCount > 0,
                shadowHostCount,
                hasShadowDom: shadowHostCount > 0
            },
            "Component discovery page diagnostics"
        );
    }

    private async waitForRenderedDom(page: Page): Promise<void> {
        logger.info({ url: page.url() }, "Waiting for rendered dashboard content before discovery");

        await page.waitForFunction(
            () => {
                const root = document.querySelector("#app") ?? document.body;
                const nodeCount = root ? root.querySelectorAll("*").length : 0;
                const interactiveCount = document.querySelectorAll(
                    "button,a,input,textarea,select,form,table,dialog,[role='button'],[role='link'],[role='textbox'],[role='combobox'],[role='dialog']"
                ).length;
                return nodeCount > 20 || interactiveCount > 0;
            },
            { timeout: COMPONENT_DISCOVERY_TIMEOUT_MS }
        );

        logger.info({ url: page.url() }, "Rendered dashboard content detected");
    }

    private async countSelectors(page: Page): Promise<Record<string, number>> {
        const counts: Record<string, number> = {};

        for (const selector of DEBUG_SELECTORS) {
            counts[selector] = await page.locator(selector).count();
        }

        return counts;
    }

    private async discoverButtons(page: Page, skipped: SkippedSummary): Promise<Component[]> {

        const locator = page.locator("button,[role='button']");
        const count = await locator.count();

        const components: Component[] = [];
        const hiddenBefore = skipped.hidden;
        for (let i = 0; i < count; i++) {
            const discovered = await this.createComponent(
                page,
                locator.nth(i),
                "button",
                `Button ${i + 1}`,
                `button:nth-of-type(${i + 1})`,
                skipped
            );
            if (discovered) {
                components.push(discovered);
            }
        }

        logger.info(
            {
                type: "button",
                totalMatched: count,
                returned: components.length,
                filteredByVisibility: skipped.hidden - hiddenBefore
            },
            "Component filtering summary"
        );

        return components;
    }

    private async discoverLinks(page: Page, skipped: SkippedSummary): Promise<Component[]> {

        const locator = page.locator("a");

        const count = await locator.count();

        const components: Component[] = [];
        const hiddenBefore = skipped.hidden;
        for (let i = 0; i < count; i++) {
            const relationships = await this.linkRelationships(locator.nth(i));
            const discovered = await this.createComponent(
                page,
                locator.nth(i),
                "link",
                `Link ${i + 1}`,
                `a:nth-of-type(${i + 1})`,
                skipped,
                relationships
            );
            if (discovered) {
                components.push(discovered);
            }
        }

        logger.info(
            {
                type: "link",
                totalMatched: count,
                returned: components.length,
                filteredByVisibility: skipped.hidden - hiddenBefore
            },
            "Component filtering summary"
        );

        return components;
    }

    private async discoverInputs(page: Page, skipped: SkippedSummary): Promise<Component[]> {

        const locator = page.locator("input,textarea");

        const count = await locator.count();

        const components: Component[] = [];
        const hiddenBefore = skipped.hidden;
        for (let i = 0; i < count; i++) {
            const discovered = await this.createComponent(
                page,
                locator.nth(i),
                "input",
                `Input ${i + 1}`,
                `input:nth-of-type(${i + 1})`,
                skipped
            );
            if (discovered) {
                components.push(discovered);
            }
        }

        logger.info(
            {
                type: "input",
                totalMatched: count,
                returned: components.length,
                filteredByVisibility: skipped.hidden - hiddenBefore
            },
            "Component filtering summary"
        );

        return components;
    }

    private async discoverNamed(
        page: Page,
        locator: Locator,
        type: Exclude<ComponentType, "button" | "link" | "input">,
        skipped: SkippedSummary
    ): Promise<Component[]> {

        const count = await locator.count();

        const components: Component[] = [];
        const hiddenBefore = skipped.hidden;
        for (let i = 0; i < count; i++) {
            const item = locator.nth(i);
            const discovered = await this.createComponent(
                page,
                item,
                type,
                `${type} ${i + 1}`,
                `${type}:nth(${i})`,
                skipped,
                await this.namedRelationships(type, item)
            );
            if (discovered) {
                components.push(discovered);
            }
        }

        logger.info(
            {
                type,
                totalMatched: count,
                returned: components.length,
                filteredByVisibility: skipped.hidden - hiddenBefore
            },
            "Component filtering summary"
        );

        return components;
    }

    private async readName(locator: Locator, fallback: string): Promise<string> {

        const text = (await locator.textContent())?.trim();

        if (text)
            return text;

        return (
            await locator.getAttribute("aria-label")
        ) ??
        (
            await locator.getAttribute("placeholder")
        ) ??
        (
            await locator.getAttribute("name")
        ) ??
        (
            await locator.getAttribute("id")
        ) ??
        fallback;
    }

    private async createComponent(
        page: Page,
        locator: Locator,
        type: ComponentType,
        fallbackName: string,
        fallbackSelector: string,
        skipped: SkippedSummary,
        relationships: ComponentRelationship[] = []
    ): Promise<Component | null> {
        try {
            const visible = await locator.isVisible();
            if (!visible) {
                skipped.hidden += 1;
                return null;
            }

            const metadata = await this.readMetadata(locator, fallbackName, visible);
            const cssSelector = await this.cssPath(locator, fallbackSelector);
            const locatorEngineResult = await locatorEngineService.build(
                page,
                locator,
                {
                    ...metadata,
                    cssPath: cssSelector
                },
                cssSelector
            );

            const structureTags = this.unique([
                metadata.role?.includes("navigation") ? "navigation" : "",
                metadata.role?.includes("menu") ? "menu" : "",
                metadata.tagName === "form" ? "form" : "",
                metadata.tagName === "table" ? "table" : "",
                metadata.tagName === "dialog" ? "modal" : ""
            ].filter(Boolean));

            return {
                type,
                name: metadata.name || fallbackName,
                selector: locatorEngineResult.bestLocator.value,
                metadata,
                locatorStrategy: locatorEngineResult.bestLocator.strategy,
                relationships,
                structureTags,
                candidateLocators: locatorEngineResult.candidates,
                fallbackLocators: locatorEngineResult.fallbackLocators
            };
        } catch (error) {
            skipped.error += 1;
            logger.warn({ err: error, type, fallbackName }, "Skipping component due to extraction error");
            return null;
        }
    }

    private async readMetadata(locator: Locator, fallbackName: string, visible: boolean): Promise<ElementContext> {
        const [
            dataTestId,
            dataTest,
            dataQa,
            id,
            nameAttribute,
            ariaLabel,
            placeholder,
            title,
            alt,
            className,
            href,
            htmlType,
            role,
            disabled,
            required,
            readOnly,
            tagName,
            text,
            relativeCssPath,
            xpath,
            relativeXpath
        ] = await Promise.all([
            locator.getAttribute("data-testid"),
            locator.getAttribute("data-test"),
            locator.getAttribute("data-qa"),
            locator.getAttribute("id"),
            locator.getAttribute("name"),
            locator.getAttribute("aria-label"),
            locator.getAttribute("placeholder"),
            locator.getAttribute("title"),
            locator.getAttribute("alt"),
            locator.getAttribute("class"),
            locator.getAttribute("href"),
            locator.getAttribute("type"),
            locator.getAttribute("role"),
            locator.isDisabled().catch(() => false),
            locator.evaluate(element => (element as HTMLInputElement).required ?? false).catch(() => false),
            locator.evaluate(element => (element as HTMLInputElement).readOnly ?? false).catch(() => false),
            locator.evaluate(element => element.tagName.toLowerCase()).catch(() => "unknown"),
            locator.textContent(),
            locator.evaluate(element => {
                const tag = element.tagName.toLowerCase();
                const className = (element.getAttribute("class") || "").trim().split(/\s+/).filter(Boolean)[0];
                const classPart = className ? `.${className}` : "";
                const id = element.getAttribute("id");
                if (id) return `#${id}`;
                return `${tag}${classPart}`;
            }).catch(() => undefined),
            locator.evaluate(element => {
                const segments: string[] = [];
                let current: Element | null = element;
                while (current) {
                    let index = 1;
                    let sibling = current.previousElementSibling;
                    while (sibling) {
                        if (sibling.tagName === current.tagName) index += 1;
                        sibling = sibling.previousElementSibling;
                    }
                    segments.unshift(`${current.tagName.toLowerCase()}[${index}]`);
                    current = current.parentElement;
                }
                return `/${segments.join("/")}`;
            }).catch(() => undefined),
            locator.evaluate(element => {
                const id = element.getAttribute("id");
                if (id) return `//*[@id=${JSON.stringify(id)}]`;
                const name = element.getAttribute("name");
                if (name) return `//${element.tagName.toLowerCase()}[@name=${JSON.stringify(name)}]`;
                const aria = element.getAttribute("aria-label");
                if (aria) return `//${element.tagName.toLowerCase()}[@aria-label=${JSON.stringify(aria)}]`;
                const text = (element.textContent || "").trim();
                if (text) return `//${element.tagName.toLowerCase()}[contains(normalize-space(.), ${JSON.stringify(text)})]`;
                return `//${element.tagName.toLowerCase()}`;
            }).catch(() => undefined)
        ]);

        const normalizedText = text?.trim() || "";
        const derivedName =
            normalizedText ||
            ariaLabel ||
            placeholder ||
            nameAttribute ||
            id ||
            fallbackName;

        const label = await this.associatedLabel(locator);

        return {
            "data-testid": dataTestId ?? undefined,
            "data-test": dataTest ?? undefined,
            "data-qa": dataQa ?? undefined,
            id: id ?? undefined,
            name: derivedName,
            nameAttribute: nameAttribute ?? undefined,
            text: normalizedText || undefined,
            tagName,
            role: role ?? undefined,
            ariaLabel: ariaLabel ?? undefined,
            "aria-label": ariaLabel ?? undefined,
            placeholder: placeholder ?? undefined,
            label: label ?? undefined,
            title: title ?? undefined,
            alt: alt ?? undefined,
            class: className ?? undefined,
            href: href ?? undefined,
            type: htmlType ?? undefined,
            disabled,
            visible,
            required,
            "readonly": readOnly,
            relativeCssPath: relativeCssPath ?? undefined,
            xpath: xpath ?? undefined,
            relativeXpath: relativeXpath ?? undefined
        };
    }

    private async associatedLabel(locator: Locator): Promise<string | null> {
        try {
            return await locator.evaluate(element => {
                const id = element.getAttribute("id");
                if (id) {
                    const external = document.querySelector(`label[for="${id}"]`);
                    const externalText = external?.textContent?.trim();
                    if (externalText) return externalText;
                }

                const wrapped = element.closest("label");
                const wrappedText = wrapped?.textContent?.trim();
                if (wrappedText) return wrappedText;

                return null;
            });
        } catch {
            return null;
        }
    }

    private async cssPath(locator: Locator, fallback: string): Promise<string> {
        return locator.evaluate(element => {
            const part = (node: Element) => {
                const tag = node.tagName.toLowerCase();
                const id = node.getAttribute("id");
                if (id) {
                    return `#${id}`;
                }

                const className = (node.getAttribute("class") || "").trim().split(/\s+/).filter(Boolean)[0];
                const classPart = className ? `.${className}` : "";

                let index = 1;
                let sibling = node.previousElementSibling;
                while (sibling) {
                    if (sibling.tagName === node.tagName) {
                        index += 1;
                    }
                    sibling = sibling.previousElementSibling;
                }

                return `${tag}${classPart}:nth-of-type(${index})`;
            };

            const parts: string[] = [];
            let current: Element | null = element;
            let depth = 0;

            while (current && depth < 6) {
                parts.unshift(part(current));
                if (current.getAttribute("id")) {
                    break;
                }
                current = current.parentElement;
                depth += 1;
            }

            return parts.join(" > ");
        }).catch(() => fallback);
    }

    private async namedRelationships(
        type: Exclude<ComponentType, "button" | "link" | "input">,
        locator: Locator
    ): Promise<ComponentRelationship[]> {
        if (type === "form") {
            return [
                {
                    type: "form_inputs",
                    targets: await this.childNames(locator, "input,textarea,select,[role='textbox'],[role='combobox']")
                }
            ];
        }

        if (type === "table") {
            return [
                {
                    type: "table_columns",
                    targets: await this.childNames(locator, "th,[role='columnheader']")
                }
            ];
        }

        if (type === "dialog") {
            return [
                {
                    type: "dialog_buttons",
                    targets: await this.childNames(locator, "button,[role='button']")
                }
            ];
        }

        return [];
    }

    private async linkRelationships(locator: Locator): Promise<ComponentRelationship[]> {
        const relationships: ComponentRelationship[] = [];

        const href = (await locator.getAttribute("href"))?.trim();
        const insideNavigation = await locator.evaluate(element =>
            Boolean(element.closest("nav,[role='navigation']"))
        ).catch(() => false);
        const insideMenu = await locator.evaluate(element =>
            Boolean(element.closest("[role='menu'],[class*='menu']"))
        ).catch(() => false);

        if (insideNavigation && href) {
            relationships.push({
                type: "navigation_target_pages",
                targets: [href]
            });
        }

        if (insideMenu) {
            const text = (await locator.textContent())?.trim();
            if (text) {
                relationships.push({
                    type: "menu_items",
                    targets: [text]
                });
            }
        }

        return relationships;
    }

    private async childNames(locator: Locator, selector: string): Promise<string[]> {
        const child = locator.locator(selector);
        const count = await child.count();
        const values: string[] = [];

        for (let i = 0; i < count; i++) {
            values.push(await this.readName(child.nth(i), `Item ${i + 1}`));
        }

        return this.unique(values.filter(Boolean));
    }

    private async discoverFocused(page: Page, analysis: StepAnalysis, skipped: SkippedSummary): Promise<DiscoveredComponents> {
        const buttons: Component[] = [];
        const links: Component[] = [];
        const inputs: Component[] = [];
        const dropdowns: Component[] = [];
        const forms: Component[] = [];
        const tables: Component[] = [];
        const dialogs: Component[] = [];

        const toFind = [...new Set([...(analysis.expectedComponents ?? []), analysis.targetComponent].filter(Boolean))] as string[];

        for (const name of toFind) {
            try {
                const btn = page.getByRole("button", { name: new RegExp(name, "i") }).first();
                if (await btn.count() > 0 && await btn.isVisible()) {
                    const comp = await this.createComponent(page, btn, "button", name, `button[role*='${name}']`, skipped);
                    if (comp) buttons.push(comp);
                }
            } catch {}

            try {
                const lnk = page.getByRole("link", { name: new RegExp(name, "i") }).first();
                if (await lnk.count() > 0 && await lnk.isVisible()) {
                    const comp = await this.createComponent(page, lnk, "link", name, `a[role*='${name}']`, skipped);
                    if (comp) links.push(comp);
                }
            } catch {}

            try {
                const byLabel = page.getByLabel(name, { exact: false }).first();
                if (await byLabel.count() > 0 && await byLabel.isVisible()) {
                    const comp = await this.createComponent(page, byLabel, "input", name, `input[name='${name}']`, skipped);
                    if (comp) inputs.push(comp);
                    continue;
                }
                const byPlaceholder = page.getByPlaceholder(name).first();
                if (await byPlaceholder.count() > 0 && await byPlaceholder.isVisible()) {
                    const comp = await this.createComponent(page, byPlaceholder, "input", name, `input[placeholder*='${name}']`, skipped);
                    if (comp) inputs.push(comp);
                    continue;
                }
            } catch {}

            try {
                const textNode = page.getByText(new RegExp(name, "i")).first();
                if (await textNode.count() > 0 && await textNode.isVisible()) {
                    const locator = textNode.locator("xpath=ancestor::button | xpath=ancestor::a | xpath=ancestor::input").first();
                    if (await locator.count() > 0 && await locator.isVisible()) {
                        const tag = await locator.evaluate(e => e.tagName.toLowerCase()).catch(() => "button");
                        const type = tag === "a" ? "link" : tag === "input" ? "input" : "button";
                        const comp = await this.createComponent(page, locator as any, type as any, name, `${tag}[contains(text(),'${name}')]`, skipped);
                        if (comp) {
                            if (type === "button") buttons.push(comp as any);
                            if (type === "link") links.push(comp as any);
                            if (type === "input") inputs.push(comp as any);
                        }
                    }
                }
            } catch {}
        }

        return { buttons, links, inputs, dropdowns, forms, tables, dialogs };
    }

    private unique(values: readonly string[]): string[] {
        return [...new Set(values)];
    }
}

export const componentDiscoveryService = new ComponentDiscoveryService();