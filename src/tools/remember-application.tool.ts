
import { openUrl } from "./open-url.tool.js";
import { ApplicationMemoryService } from "../memory/services/application.memory.service.js";

const memory = new ApplicationMemoryService();

export async function rememberApplication(
    applicationName: string,
    url: string
) {

    await openUrl(url);

    const app = await memory.remember(applicationName);

    return app;

}