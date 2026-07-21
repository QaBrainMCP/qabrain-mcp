import { Page } from "playwright";
import { LoginSession } from "./types.js";

export class LoginEngine {
    async login(page: Page, url: string, username?: string, password?: string): Promise<LoginSession> {
        // Lightweight generic login flow - meant to be extended per-application
        await page.goto(url, { waitUntil: "domcontentloaded" });
        return {
            browser: (page.context() as any).browser,
            context: page.context(),
            page,
            cookies: await page.context().cookies(),
            storageState: await page.context().storageState()
        } as LoginSession;
    }
}

export const loginEngine = new LoginEngine();
