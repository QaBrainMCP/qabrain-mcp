import { StartAutomationSessionTool } from "../mcp/tools/start-automation-session.tool.js";
import { PrepareGenerationContextTool } from "../mcp/tools/prepare-generation-context.tool.js";

async function main() {
    const start = await StartAutomationSessionTool.execute({ application: "OrangeHRM", feature: "Login.feature" });
    console.log('start ->', JSON.stringify(start, null, 2));

    const sessionId = (start as any).sessionId;
    const ctx = await PrepareGenerationContextTool.execute({ sessionId, pageName: "Login" } as any);
    console.log('generationContext ->', JSON.stringify(ctx, null, 2));
}

main().catch(err=>{ console.error(err); process.exit(1); });
