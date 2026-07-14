import { openUrl } from "./open-url.tool.js";
import { PageKnowledgeService } from "../knowledge/services/page.knowledge.service.js";
import { logger } from "../utils/logger.js";

const service = new PageKnowledgeService();

export async function rememberPage(
    url: string
) {

    await openUrl(url);

    const page = await service.remember();

    console.log("========== PAGE REMEMBERED ==========");

    logger.info(
    {
        page
    },
    "Page remembered successfully"
);

    return page;

}