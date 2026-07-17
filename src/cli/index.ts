#!/usr/bin/env node


import { startCommand } from "./commands/start.command.js";
import { doctorCommand } from "./commands/doctor.command.js";
import { versionCommand } from "./commands/version.command.js";
import { helpCommand } from "./commands/help.command.js";
import { configCommand } from "./commands/config.command.js";
import { initCommand } from "./commands/init.command.js";
async function main() {
    const command = process.argv[2] ?? "help";

    switch (command.toLowerCase()) {
        case "start":
            await startCommand();
            break;

        case "doctor":
            await doctorCommand();
            break;

        case "version":
            versionCommand();
            break;

        case "config":
            configCommand();
            break;

        case "help":
        default:
            helpCommand();
            break;
            case "init":
    await initCommand();
    break;
    }
}

main().catch((error) => {
    console.error("❌", error instanceof Error ? error.message : error);
    process.exit(1);
});