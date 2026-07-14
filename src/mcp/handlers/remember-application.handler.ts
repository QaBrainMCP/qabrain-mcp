import { rememberApplication } from "../../tools/remember-application.tool.js";

export async function rememberApplicationHandler(
    applicationName: string,
    url: string
) {
    return await rememberApplication(applicationName, url);
}