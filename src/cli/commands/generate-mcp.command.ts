import fs from "node:fs";
import path from "node:path";

export function generateMcpConfig(): void {
    const vscodeDir = path.resolve(".vscode");

    if (!fs.existsSync(vscodeDir)) {
        fs.mkdirSync(vscodeDir, { recursive: true });
    }

    const config = {
        servers: {
            qabrain: {
                command: "node",
                args: [
                    "dist/index.js"
                ],
                cwd: "${workspaceFolder}"
            }
        }
    };

    fs.writeFileSync(
        path.join(vscodeDir, "mcp.json"),
        JSON.stringify(config, null, 4),
        "utf8"
    );

    console.log("✅ Generated .vscode/mcp.json");
}