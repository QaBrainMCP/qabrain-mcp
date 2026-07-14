import { browserManager } from "../browser/browser.manager.js";
import { PageInspectService } from "../inspect/services/page.inspect.service.js";
import { openUrl } from "./open-url.tool.js";

const inspector = new PageInspectService();

export async function inspectPage() {
   await openUrl("https://playwright.dev");
    const result = await inspector.inspect();

    console.log("========== PAGE INSPECTION ==========");

    console.log(JSON.stringify(result, null, 2));

}