import { StartAutomationSessionTool } from "../mcp/tools/start-automation-session.tool.js";
import { ExecuteGoalTool } from "../mcp/tools/execute-goal.tool.js";

async function main(){
    const start = await StartAutomationSessionTool.execute({ application: 'OrangeHRM', feature: 'Login.feature' });
    const sessionId = (start as any).sessionId;
    const goal = 'Generate Login Automation';
    const resp = await ExecuteGoalTool.execute({ goal, sessionId } as any);
    console.log(JSON.stringify(resp, null, 2));
}

main().catch(err=>{ console.error(err); process.exit(1); });
