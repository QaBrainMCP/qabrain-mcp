import { describe, expect, it, vi } from "vitest";
import { PageManager } from "./page.manager.js";

describe("PageManager", () => {
    it("creates a page on first access and reuses it", async () => {
        const manager = new PageManager();
        const page = { close: async () => undefined, on: () => undefined } as never;
        const context = { newPage: async () => page, close: async () => undefined } as never;
        const browser = { newContext: async () => context, close: async () => undefined } as never;

        const browserManagerModule = await import("./browser.manager.js");
        const originalLaunch = browserManagerModule.browserManager.launch;
        browserManagerModule.browserManager.launch = async () => browser as never;

        try {
            const first = await manager.getPage();
            const second = await manager.getPage();

            expect(first).toBe(second);
        } finally {
            browserManagerModule.browserManager.launch = originalLaunch;
        }
    });

    it("reuses the same page and context without creating duplicate pages", async () => {
        const manager = new PageManager();
        const page = { close: async () => undefined, on: () => undefined } as never;
        const context = { newPage: vi.fn(async () => page), close: async () => undefined } as unknown as { newPage: ReturnType<typeof vi.fn>; close: () => Promise<void> };
        const browser = { newContext: vi.fn(async () => context), close: async () => undefined } as unknown as { newContext: ReturnType<typeof vi.fn>; close: () => Promise<void> };

        const browserManagerModule = await import("./browser.manager.js");
        const originalLaunch = browserManagerModule.browserManager.launch;
        const originalGetPage = browserManagerModule.browserManager.getPage;
        browserManagerModule.browserManager.launch = async () => browser as never;
        browserManagerModule.browserManager.getPage = () => page as never;

        try {
            const first = await manager.getPage();
            const second = await manager.getPage();

            expect(first).toBe(second);
            expect(context.newPage).not.toHaveBeenCalled();
        } finally {
            browserManagerModule.browserManager.launch = originalLaunch;
            browserManagerModule.browserManager.getPage = originalGetPage;
        }
    });

    it("closes the page and context when requested", async () => {
        const manager = new PageManager();
        const page = { close: async () => undefined, on: () => undefined } as never;
        const context = { newPage: async () => page, close: async () => undefined } as never;
        const browser = { newContext: async () => context, close: async () => undefined } as never;

        const browserManagerModule = await import("./browser.manager.js");
        const originalLaunch = browserManagerModule.browserManager.launch;
        browserManagerModule.browserManager.launch = async () => browser as never;

        try {
            await manager.getPage();
            await manager.closePage();

            expect(true).toBe(true);
        } finally {
            browserManagerModule.browserManager.launch = originalLaunch;
        }
    });
});
