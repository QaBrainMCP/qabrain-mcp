import { pageManager } from "../../browser/page.manager.js";
import { loadConfiguration } from "../../config/index.js";
import { logger } from "../../utils/logger.js";

const ORANGEHRM_TIMEOUT_MS = 60_000;

export class OrangeHRMLoginService {
    async login(): Promise<void> {
        const config = loadConfiguration();
        const page = await pageManager.getPage();

        logger.info("Opening OrangeHRM...");

        await page.goto(config.app.application.url, {
            waitUntil: "domcontentloaded",
            timeout: ORANGEHRM_TIMEOUT_MS
        });

        await page.locator("input[name='username']").waitFor({
            state: "visible",
            timeout: ORANGEHRM_TIMEOUT_MS
        });

        await page.locator("input[name='password']").waitFor({
            state: "visible",
            timeout: ORANGEHRM_TIMEOUT_MS
        });

        await page.locator("input[name='username']").fill(
            config.app.application.username
        );

        await page.locator("input[name='password']").fill(
            config.app.application.password
        );

        await page.getByRole("button", { name: /login/i }).click();

        await page.waitForURL(/dashboard/i, {
            timeout: ORANGEHRM_TIMEOUT_MS,
            waitUntil: "domcontentloaded"
        });

        logger.info("Successfully logged into OrangeHRM");
    }
}

export const orangeHRMLoginService = new OrangeHRMLoginService();