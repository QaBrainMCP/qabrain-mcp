import { chromium, Browser, BrowserContext, Page } from "playwright";
import fs from "node:fs";
import path from "node:path";

const DEFAULT_RETRIES = 2;

export class BrowserLauncher {
    private browser: Browser | null = null;
    private context: BrowserContext | null = null;

    private getHeadless(): boolean {
        const val = process.env.QABRAIN_HEADLESS ?? process.env.HEADLESS ?? "true";
        return val.toLowerCase() === "true";
    }

    async launch(retries = DEFAULT_RETRIES): Promise<Browser> {
        if (this.browser) return this.browser;

        let lastErr: unknown = null;
        for (let i = 0; i <= retries; i++) {
            try {
                this.browser = await chromium.launch({ headless: this.getHeadless() });
                return this.browser;
            } catch (err) {
                lastErr = err;
                // small backoff
                await new Promise(r => setTimeout(r, 250 * (i + 1)));
            }
        }

        throw lastErr;
    }

    async newContext(options?: Parameters<Browser["newContext"]>[0]): Promise<BrowserContext> {
        if (!this.browser) await this.launch();
        if (!this.browser) throw new Error("Browser not available");
        this.context = await this.browser.newContext(options);
        return this.context;
    }

    async newPage(): Promise<Page> {
        if (!this.context) await this.newContext();
        if (!this.context) throw new Error("Context not available");
        const page = await this.context.newPage();
        return page;
    }

    async close(): Promise<void> {
        try {
            if (this.context) {
                await this.context.close();
                this.context = null;
            }
        } finally {
            if (this.browser) {
                await this.browser.close();
                this.browser = null;
            }
        }
    }
}

export const browserLauncher = new BrowserLauncher();
