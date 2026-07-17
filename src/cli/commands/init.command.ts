import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { generateMcpConfig } from "./generate-mcp.command.js";

export async function initCommand(): Promise<void> {
    console.log("🚀 QaBrain Initializer");
    console.log("---------------------------");

    // Node Version
    console.log(`✅ Node.js : ${process.version}`);

    // npm Version
    try {
        const npmVersion = execSync("npm -v").toString().trim();
        console.log(`✅ npm     : ${npmVersion}`);
    } catch {
        console.log("❌ npm not found");
    }

    // Environment
    const env = path.resolve(".env");
    const example = path.resolve(".env.example");

    if (!fs.existsSync(env)) {
        if (fs.existsSync(example)) {
            fs.copyFileSync(example, env);
            console.log("✅ Created .env");
        } else {
            console.log("⚠️ .env.example not found");
        }
    } else {
        console.log("✅ .env exists");
    }

    // Playwright
    try {
        execSync("npx playwright --version", { stdio: "ignore" });
        console.log("✅ Playwright installed");
    } catch {
        console.log("⚠️ Playwright not installed");
        console.log("Run: npx playwright install");
    }

    // Dist folder
    if (fs.existsSync(path.resolve("dist"))) {
        console.log("✅ Build exists");
    } else {
        console.log("⚠️ Build not found");
        console.log("Run: npm run build");
    }
 generateMcpConfig();
    console.log("---------------------------");
   
    console.log("🎉 QaBrain is ready.");
}