import { startRecording } from "./tools/start-recording.tool.js";
import { stopRecording } from "./tools/stop-recording.tool.js";
import { openUrl } from "./tools/open-url.tool.js";
import { logger } from "./utils/logger.js";

async function run() {

    logger.info("Starting workflow recording...");

    await startRecording();

    await openUrl("https://playwright.dev");

    await openUrl("https://playwright.dev/docs/intro");

    const workflow = await stopRecording();

    logger.info(workflow, "Recorded Workflow");
}

run().catch((error) => {
    logger.error(error);
});