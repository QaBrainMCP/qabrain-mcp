import { loadConfiguration } from "../../config/index.js";

export function configCommand(): void {
    const config = loadConfiguration();

    console.log(JSON.stringify(config, null, 2));
}