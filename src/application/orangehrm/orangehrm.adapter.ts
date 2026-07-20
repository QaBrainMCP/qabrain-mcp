import { Page } from "playwright";
import { loadConfiguration } from "../../config/index.js";
import { ApplicationAdapter } from "../adapters/application.adapter.js";
import { logger } from "../../utils/logger.js";

const ORANGEHRM_TIMEOUT_MS = 60_000;

export class OrangeHRMAdapter implements ApplicationAdapter {

    readonly name = "OrangeHRM";

    async login(page: Page): Promise<void> {
        const config = loadConfiguration();

        if (!config.app.application.username || !config.app.application.password) {
            throw new Error("OrangeHRM credentials are missing. Check APP_USERNAME and APP_PASSWORD.");
        }

        logger.info(
            {
                app: this.name,
                url: config.app.application.url,
                hasUsername: Boolean(config.app.application.username),
                hasPassword: Boolean(config.app.application.password)
            },
            "Login started"
        );

        logger.info({ app: this.name, url: config.app.application.url }, "page.goto started");
        await page.goto(config.app.application.url, {
            waitUntil: "domcontentloaded",
            timeout: ORANGEHRM_TIMEOUT_MS
        });
        logger.info({ app: this.name, url: page.url() }, "page.goto completed");

        await page.locator("input[name='username']").waitFor({
            state: "visible",
            timeout: ORANGEHRM_TIMEOUT_MS
        });
        await page.locator("input[name='password']").waitFor({
            state: "visible",
            timeout: ORANGEHRM_TIMEOUT_MS
        });

        logger.info({ app: this.name }, "Filling login credentials");
        await page.locator("input[name='username']").fill(config.app.application.username);
        await page.locator("input[name='password']").fill(config.app.application.password);

        await page.getByRole("button", { name: /login/i }).click();
        logger.info({ app: this.name }, "Login form submitted");

        logger.info({ app: this.name }, "Waiting for dashboard URL");
        await page.waitForURL(/dashboard/i, {
            timeout: ORANGEHRM_TIMEOUT_MS,
            waitUntil: "domcontentloaded"
        });

        await page.locator("body").first().waitFor({
            state: "visible",
            timeout: ORANGEHRM_TIMEOUT_MS
        });

        logger.info({ app: this.name, url: page.url() }, "Login completed");
    }

    async verify(page: Page): Promise<boolean> {
        logger.info({ app: this.name, url: page.url() }, "Verification started");
        const verified = page.url().includes("dashboard");
        logger.info({ app: this.name, verified, url: page.url() }, "Verification completed");
        return verified;
    }
}

export const orangeHRMAdapter = new OrangeHRMAdapter();