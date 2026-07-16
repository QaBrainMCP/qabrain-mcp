import { loadConfiguration } from "../../config/index.js";

export function versionCommand(): void {
    const config = loadConfiguration();

    console.log(`${config.app.name} v${config.app.version}`);
}