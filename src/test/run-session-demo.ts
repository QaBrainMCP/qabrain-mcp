import { StartAutomationSessionTool } from "../mcp/tools/start-automation-session.tool.js";
import { GetSessionContextTool } from "../mcp/tools/get-session-context.tool.js";
import { CloseSessionTool } from "../mcp/tools/close-session.tool.js";

async function main() {
    const start = await StartAutomationSessionTool.execute({ application: "OrangeHRM", feature: "Login.feature" });
    console.log('start ->', JSON.stringify(start, null, 2));

    const sessionId = (start as any).sessionId;
    const ctx = await GetSessionContextTool.execute({ sessionId } as any);
    console.log('context ->', JSON.stringify(ctx, null, 2));

    const closed = await CloseSessionTool.execute({ sessionId } as any);
    console.log('closed ->', JSON.stringify(closed, null, 2));
}

main().catch(err=>{ console.error(err); process.exit(1); });
