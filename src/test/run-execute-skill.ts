import { StartAutomationSessionTool } from "../mcp/tools/start-automation-session.tool.js";
import { ExecuteSkillTool } from "../mcp/tools/execute-skill.tool.js";

async function main() {
    const start = await StartAutomationSessionTool.execute({ application: "OrangeHRM", feature: "Login.feature" });
    const sessionId = (start as any).sessionId;
    const skillResp = await ExecuteSkillTool.execute({ skill: "generate_page_object", sessionId, page: "Login" } as any);
    console.log(JSON.stringify(skillResp, null, 2));
}

main().catch(err=>{ console.error(err); process.exit(1); });
