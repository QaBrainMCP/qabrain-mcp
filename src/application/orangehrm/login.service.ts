import { pageManager } from "../../browser/page.manager.js";
import { loadConfiguration } from "../../config/index.js";
import { logger } from "../../utils/logger.js";

export class OrangeHRMLoginService {
    async login(): Promise<void> {
        const config = loadConfiguration();
        const page = await pageManager.getPage();

        logger.info("Opening OrangeHRM...");

        await page.goto(config.app.application.url, {
            waitUntil: "networkidle"
        });

        await page.getByPlaceholder("Username").fill(
            config.app.application.username
        );

        await page.getByPlaceholder("Password").fill(
            config.app.application.password
        );

        await page.getByRole("button", { name: "Login" }).click();

        await page.waitForURL(/dashboard/i, {
            timeout: 15000
        });

        logger.info("Successfully logged into OrangeHRM");
    }
}

export const orangeHRMLoginService = new OrangeHRMLoginService();