import { Page } from "playwright";
import { loadConfiguration } from "../../config/index.js";
import { ApplicationAdapter } from "../adapters/application.adapter.js";

export class OrangeHRMAdapter implements ApplicationAdapter {

    readonly name = "OrangeHRM";

    async login(page: Page): Promise<void> {

        const config = loadConfiguration();

        await page.goto(config.app.application.url);

        await page
            .getByPlaceholder("Username")
            .fill(config.app.application.username);

        await page
            .getByPlaceholder("Password")
            .fill(config.app.application.password);

        await page
            .getByRole("button", { name: "Login" })
            .click();

        await page.waitForURL(/dashboard/i);
    }

    async verify(page: Page): Promise<boolean> {

        return page.url().includes("dashboard");

    }
}

export const orangeHRMAdapter = new OrangeHRMAdapter();