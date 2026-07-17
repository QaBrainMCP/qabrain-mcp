import type { MCPTool } from "../../mcp/registry/tool.registry.js";


import { MapRequirementTool } from "../../mcp/tools/map-requirement.mcp.js";
import { LearnApplicationTool } from "../../mcp/tools/learn-application.mcp.js";
import { AnalyzeCoverageTool } from "../../mcp/tools/analyze-coverage.mcp.js";
import { AnalyzeImpactTool } from "../../mcp/tools/analyze-impact.mcp.js";
import { AskQaBrainTool } from "../../mcp/tools/ask-qabrain.mcp.js";
import { ReasonAboutRequirementTool } from "../../mcp/tools/reason-about-requirement.mcp.js";
import { BuildKnowledgeGraphTool } from "../../mcp/tools/build-knowledge-graph.mcp.js";
import { QueryKnowledgeGraphTool } from "../../mcp/tools/query-knowledge-graph.mcp.js";
import { CreateSnapshotTool } from "../../mcp/tools/create-snapshot.mcp.js";
import { CompareSnapshotsTool } from "../../mcp/tools/compare-snapshots.mcp.js";
import { LearnIncrementallyTool } from "../../mcp/tools/learn-incrementally.mcp.js";

export const coreTools: readonly MCPTool[] = [
    MapRequirementTool,
    LearnApplicationTool,
    AnalyzeCoverageTool,
    AnalyzeImpactTool,
    AskQaBrainTool,
    ReasonAboutRequirementTool,
    BuildKnowledgeGraphTool,
    QueryKnowledgeGraphTool,
    CreateSnapshotTool,
    CompareSnapshotsTool,
    LearnIncrementallyTool
];