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
import { LearnFeatureTool } from "../../mcp/tools/learn-feature.tool.js";
import { GetAutomationContextTool } from "../../mcp/tools/get-automation-context.tool.js";
import { GetPageTool } from "../../mcp/tools/get-page.mcp.js";
import { GetPageModelTool } from "../../mcp/tools/get-page-model.mcp.js";
import { GetComponentTool } from "../../mcp/tools/get-component.mcp.js";
import { GetBestLocatorTool } from "../../mcp/tools/get-best-locator.mcp.js";
import { SearchComponentsTool } from "../../mcp/tools/search-components.mcp.js";
import { GetNavigationTool } from "../../mcp/tools/get-navigation.mcp.js";
import { CompareSnapshotTool } from "../../mcp/tools/compare-snapshot.mcp.js";
import { RepositoryStatsTool } from "../../mcp/tools/repository-stats.mcp.js";
import { SearchPagesTool } from "../../mcp/tools/search-pages.tool.js";
import { StartAutomationSessionTool } from "../../mcp/tools/start-automation-session.tool.js";
import { GetSessionContextTool } from "../../mcp/tools/get-session-context.tool.js";
import { RefreshSessionTool } from "../../mcp/tools/refresh-session.tool.js";
import { CloseSessionTool } from "../../mcp/tools/close-session.tool.js";
import { ListSessionsTool } from "../../mcp/tools/list-sessions.tool.js";
import { PrepareGenerationContextTool } from "../../mcp/tools/prepare-generation-context.tool.js";
import { ExecuteSkillTool } from "../../mcp/tools/execute-skill.tool.js";
import { ExecuteGoalTool } from "../../mcp/tools/execute-goal.tool.js";

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
    , GetPageTool
    , GetPageModelTool
    , GetComponentTool
    , GetBestLocatorTool
    , SearchComponentsTool
    , GetNavigationTool
    , CompareSnapshotTool
    , RepositoryStatsTool
    , LearnFeatureTool
    , GetAutomationContextTool
    , SearchPagesTool
    , StartAutomationSessionTool
    , GetSessionContextTool
    , RefreshSessionTool
    , CloseSessionTool
    , ListSessionsTool
    , PrepareGenerationContextTool
        , ExecuteSkillTool
            , ExecuteGoalTool
];