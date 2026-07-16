import { applicationMapService } from "../application/services/application-map.service.js";
import { browserManager } from "../browser/browser.manager.js";
import { logger } from "../utils/logger.js";

export async function buildApplicationMap(applicationName: string) {

    const page = await browserManager.ensurePage();

    applicationMapService.create(applicationName);

    applicationMapService.addPage({

        id: crypto.randomUUID(),

        title: await page.title(),

        url: page.url()

    });

    const map = applicationMapService.getMap();

    logger.info(map, "Application Map");

    return map;

}