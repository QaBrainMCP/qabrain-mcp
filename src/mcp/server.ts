import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTools } from "./tools.js";
import { toolRegistry } from "./registry/tool.registry.js";
import { MapRequirementTool } from "./tools/map-requirement.mcp.js";
import { LearnApplicationTool } from "./tools/learn-application.mcp.js";
import { AnalyzeCoverageTool } from "./tools/analyze-coverage.mcp.js";
import { AnalyzeImpactTool } from "./tools/analyze-impact.mcp.js";
import { AskQaBrainTool } from "./tools/ask-qabrain.mcp.js";
import { ReasonAboutRequirementTool } from "./tools/reason-about-requirement.mcp.js";
import { BuildKnowledgeGraphTool } from "./tools/build-knowledge-graph.mcp.js";
import { QueryKnowledgeGraphTool } from "./tools/query-knowledge-graph.mcp.js";
import { CreateSnapshotTool } from "./tools/create-snapshot.mcp.js";
import { CompareSnapshotsTool } from "./tools/compare-snapshots.mcp.js";
import { LearnIncrementallyTool } from "./tools/learn-incrementally.mcp.js";
import { azureTools } from "../plugins/azure-devops/mcp/azure.tools.js";
import { createLogger } from "../utils/logger.js";
import type { RuntimeConfig } from "../config/environment.js";

export async function startServer(config: RuntimeConfig) {
    const logger = createLogger(config.logger.level, config.logger.pretty);

    const server = new Server(
        {
            name: config.app.name,
            version: config.app.version,
        },
        {
            capabilities: {
                tools: {},
            },
        }
    );

    toolRegistry.register(MapRequirementTool);
    toolRegistry.register(LearnApplicationTool);
    toolRegistry.register(AnalyzeCoverageTool);
    toolRegistry.register(AnalyzeImpactTool);
    toolRegistry.register(AskQaBrainTool);
    toolRegistry.register(ReasonAboutRequirementTool);
    toolRegistry.register(BuildKnowledgeGraphTool);
    toolRegistry.register(QueryKnowledgeGraphTool);
    toolRegistry.register(CreateSnapshotTool);
    toolRegistry.register(CompareSnapshotsTool);
    toolRegistry.register(LearnIncrementallyTool);
    azureTools.forEach(tool => toolRegistry.register(tool));
    logger.info("Map Requirement Tool Registered");
    logger.info("Learn Application Tool Registered");
    logger.info("Analyze Coverage Tool Registered");
    logger.info("Analyze Impact Tool Registered");
    logger.info("Ask QaBrain Tool Registered");
    logger.info("Reason About Requirement Tool Registered");
    logger.info("Build Knowledge Graph Tool Registered");
    logger.info("Query Knowledge Graph Tool Registered");
    logger.info("Create Snapshot Tool Registered");
    logger.info("Compare Snapshots Tool Registered");
    logger.info("Learn Incrementally Tool Registered");
    logger.info("Azure DevOps Tools Registered");

    registerTools(server);

    const transport = new StdioServerTransport();

    await server.connect(transport);

    logger.info("✅ MCP Connected");
}
