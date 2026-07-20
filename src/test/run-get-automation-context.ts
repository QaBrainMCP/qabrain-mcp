import { GetAutomationContextTool } from "../mcp/tools/get-automation-context.tool.js";

async function main() {
    const req = {
        pageName: "Login",
        includeNavigation: true,
        includeVerification: true,
        includeHistory: false
    };

    const resp = await GetAutomationContextTool.execute(req as any);
    console.log(JSON.stringify(resp, null, 2));
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
