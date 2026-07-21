import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { toolRegistry } from "./registry/tool.registry.js";
import { logger } from "../utils/logger.js";

interface MapRequirementArguments {
    feature: string;
}

interface LearnApplicationArguments {
    application: string;
}

interface AnalyzeCoverageArguments {
    requirement: string;
}

interface AnalyzeImpactArguments {
    page: string;
}

interface AskQaBrainArguments {
    question: string;
}

interface ReasonAboutRequirementArguments {
    requirement: string;
}

interface QueryKnowledgeGraphArguments {
    query: string;
}

interface CreateSnapshotArguments {
    application: string;
}

interface CompareSnapshotsArguments {
    previousSnapshotId: string;
    currentSnapshotId: string;
}

interface LearnIncrementallyArguments {
    application: string;
}

interface AzureConnectionArguments {
    organizationUrl: string;
    projectName: string;
    personalAccessToken?: string;
}

interface AzureProjectArguments {
    project: string;
}

export function registerTools(server: Server): void {
    server.setRequestHandler(ListToolsRequestSchema, async () => ({
        tools: toolRegistry.getAll().filter(tool =>
            tool.name === "map_requirement" || tool.name === "learn_application" ||
            tool.name === "analyze_coverage" || tool.name === "analyze_impact" || tool.name === "ask_qabrain" ||
            tool.name === "reason_about_requirement" || tool.name === "build_knowledge_graph" ||
            tool.name === "query_knowledge_graph" || tool.name === "create_snapshot" ||
            tool.name === "compare_snapshots" || tool.name === "learn_incrementally" ||
            tool.name === "connect_azure" || tool.name === "import_projects" ||
            tool.name === "import_workitems" || tool.name === "import_testcases" ||
            tool.name === "import_testplans" || tool.name === "sync_azure"
        ).map(tool => ({
            name: tool.name,
            description: tool.description,
            inputSchema: schemaForTool(tool.name)
        }))
    }));

    server.setRequestHandler(CallToolRequestSchema, async request => {
        if (request.params.name === "map_requirement") {
            return executeMapRequirement(request.params.arguments);
        }
        if (request.params.name === "learn_application") {
            return executeLearnApplication(request.params.arguments);
        }
        if (request.params.name === "analyze_coverage") {
            return executeAnalyzeCoverage(request.params.arguments);
        }
        if (request.params.name === "analyze_impact") {
            return executeAnalyzeImpact(request.params.arguments);
        }
        if (request.params.name === "ask_qabrain") {
            return executeAskQaBrain(request.params.arguments);
        }
        if (request.params.name === "reason_about_requirement") {
            return executeReasonAboutRequirement(request.params.arguments);
        }
        if (request.params.name === "build_knowledge_graph") {
            return executeTool("build_knowledge_graph", {});
        }
        if (request.params.name === "query_knowledge_graph") {
            return executeQueryKnowledgeGraph(request.params.arguments);
        }
        if (request.params.name === "create_snapshot") {
            return executeCreateSnapshot(request.params.arguments);
        }
        if (request.params.name === "compare_snapshots") {
            return executeCompareSnapshots(request.params.arguments);
        }
        if (request.params.name === "learn_incrementally") {
            return executeLearnIncrementally(request.params.arguments);
        }
        if (request.params.name === "connect_azure") {
            return executeConnectAzure(request.params.arguments);
        }
        if (request.params.name === "import_projects") {
            return executeTool("import_projects", {});
        }
        if (request.params.name === "import_workitems" || request.params.name === "import_testcases" ||
            request.params.name === "import_testplans" || request.params.name === "sync_azure") {
            return executeAzureProjectTool(request.params.name, request.params.arguments);
        }
        {
            throw new Error(`Unsupported MCP tool: ${request.params.name}`);
        }
    });
}

async function executeMapRequirement(argumentsValue: unknown) {
    if (!isMapRequirementArguments(argumentsValue)) {
        throw new Error("map_requirement requires a string feature argument");
    }
    return executeTool("map_requirement", argumentsValue);
}

async function executeLearnApplication(argumentsValue: unknown) {
    if (!isLearnApplicationArguments(argumentsValue)) {
        throw new Error("learn_application requires a string application argument");
    }
    logger.info({ application: argumentsValue.application }, "MCP learn_application started");
    return executeTool("learn_application", argumentsValue);
}

async function executeAnalyzeCoverage(argumentsValue: unknown) {
    if (!isAnalyzeCoverageArguments(argumentsValue)) {
        throw new Error("analyze_coverage requires a string requirement argument");
    }
    return executeTool("analyze_coverage", argumentsValue);
}

async function executeAnalyzeImpact(argumentsValue: unknown) {
    if (!isAnalyzeImpactArguments(argumentsValue)) {
        throw new Error("analyze_impact requires a string page argument");
    }
    return executeTool("analyze_impact", argumentsValue);
}

async function executeAskQaBrain(argumentsValue: unknown) {
    if (!isAskQaBrainArguments(argumentsValue)) {
        throw new Error("ask_qabrain requires a string question argument");
    }
    return executeTool("ask_qabrain", argumentsValue);
}

async function executeReasonAboutRequirement(argumentsValue: unknown) {
    if (!isReasonAboutRequirementArguments(argumentsValue)) {
        throw new Error("reason_about_requirement requires a string requirement argument");
    }
    return executeTool("reason_about_requirement", argumentsValue);
}

async function executeQueryKnowledgeGraph(argumentsValue: unknown) {
    if (!isQueryKnowledgeGraphArguments(argumentsValue)) {
        throw new Error("query_knowledge_graph requires a string query argument");
    }
    return executeTool("query_knowledge_graph", argumentsValue);
}

async function executeCreateSnapshot(argumentsValue: unknown) {
    if (!isCreateSnapshotArguments(argumentsValue)) {
        throw new Error("create_snapshot requires a string application argument");
    }
    return executeTool("create_snapshot", argumentsValue);
}

async function executeCompareSnapshots(argumentsValue: unknown) {
    if (!isCompareSnapshotsArguments(argumentsValue)) {
        throw new Error("compare_snapshots requires previousSnapshotId and currentSnapshotId arguments");
    }
    return executeTool("compare_snapshots", argumentsValue);
}

async function executeLearnIncrementally(argumentsValue: unknown) {
    if (!isLearnIncrementallyArguments(argumentsValue)) {
        throw new Error("learn_incrementally requires a string application argument");
    }
    return executeTool("learn_incrementally", argumentsValue);
}

async function executeConnectAzure(argumentsValue: unknown) {
    if (!isAzureConnectionArguments(argumentsValue)) {
        throw new Error("connect_azure requires organizationUrl and projectName arguments");
    }
    return executeTool("connect_azure", argumentsValue);
}

async function executeAzureProjectTool(name: string, argumentsValue: unknown) {
    if (!isAzureProjectArguments(argumentsValue)) {
        throw new Error(`${name} requires a string project argument`);
    }
    return executeTool(name, argumentsValue);
}

async function executeTool(name: string, argumentsValue: unknown) {
    const tool = toolRegistry.get(name);
    if (!tool) {
        throw new Error(`${name} is not registered`);
    }

    // tool-level timeout and cancellation support (backward-compatible)
    const timeoutMs = Number(process.env.TOOL_TIMEOUT_MS ?? 120_000);

    function timeoutPromise(ms: number) {
        return new Promise<never>((_, rej) => setTimeout(() => rej(new Error("Tool execution timed out")), ms));
    }

    logger.info({ tool: name, timeoutMs }, "MCP tool execution started");

    try {
        const stop = (await import("../utils/metrics.js")).metrics.startTimer("mcp.tool.exec.ms");
        const execPromise = tool.execute(argumentsValue);
        const result = await Promise.race([execPromise as Promise<unknown>, timeoutPromise(timeoutMs)]);
        const ms = stop();
        (await import("../utils/metrics.js")).metrics.record("mcp.tool.exec.ms", ms, { tool: name });
        logger.info({ tool: name, durationMs: Math.round(ms) }, "MCP tool execution completed");
        return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
    } catch (error: unknown) {
        // If timeout occurred, attempt to call a cancel method on the tool (if it exposes one)
        if ((error as Error).message === "Tool execution timed out") {
            try {
                const t: any = tool as any;
                if (typeof t.cancel === "function") {
                    try { await t.cancel(); } catch (cancelErr) { logger.warn({ err: cancelErr, tool: name }, "Tool cancel failed"); }
                }
            } catch {}
        }
        (await import("../utils/metrics.js")).metrics.snapshot("mcp.tool.exec.failure.memory");
        logger.error({ err: error, tool: name }, "MCP tool execution failed");
        throw error;
    }
}

function mapRequirementSchema() {
    return {
        type: "object" as const,
        properties: { feature: { type: "string" } },
        required: ["feature"],
        additionalProperties: false
    };
}

function schemaForTool(name: string) {
    if (name === "map_requirement") return mapRequirementSchema();
    if (name === "learn_application") return learnApplicationSchema();
    if (name === "analyze_coverage") return analyzeCoverageSchema();
    if (name === "analyze_impact") return analyzeImpactSchema();
    if (name === "ask_qabrain") return askQaBrainSchema();
    if (name === "reason_about_requirement") return reasonAboutRequirementSchema();
    if (name === "build_knowledge_graph") return emptySchema();
    if (name === "create_snapshot") return createSnapshotSchema();
    if (name === "compare_snapshots") return compareSnapshotsSchema();
    if (name === "learn_incrementally") return learnIncrementallySchema();
    if (name === "connect_azure") return azureConnectionSchema();
    if (name === "import_projects") return emptySchema();
    if (name === "import_workitems" || name === "import_testcases" || name === "import_testplans" || name === "sync_azure") {
        return azureProjectSchema();
    }
    return queryKnowledgeGraphSchema();
}

function learnApplicationSchema() {
    return {
        type: "object" as const,
        properties: { application: { type: "string" } },
        required: ["application"],
        additionalProperties: false
    };
}

function analyzeCoverageSchema() {
    return {
        type: "object" as const,
        properties: { requirement: { type: "string" } },
        required: ["requirement"],
        additionalProperties: false
    };
}

function analyzeImpactSchema() {
    return {
        type: "object" as const,
        properties: { page: { type: "string" } },
        required: ["page"],
        additionalProperties: false
    };
}

function askQaBrainSchema() {
    return {
        type: "object" as const,
        properties: { question: { type: "string" } },
        required: ["question"],
        additionalProperties: false
    };
}

function reasonAboutRequirementSchema() {
    return {
        type: "object" as const,
        properties: { requirement: { type: "string" } },
        required: ["requirement"],
        additionalProperties: false
    };
}

function emptySchema() {
    return { type: "object" as const, properties: {}, additionalProperties: false };
}

function queryKnowledgeGraphSchema() {
    return {
        type: "object" as const,
        properties: { query: { type: "string" } },
        required: ["query"],
        additionalProperties: false
    };
}

function createSnapshotSchema() {
    return {
        type: "object" as const,
        properties: { application: { type: "string" } },
        required: ["application"],
        additionalProperties: false
    };
}

function compareSnapshotsSchema() {
    return {
        type: "object" as const,
        properties: {
            previousSnapshotId: { type: "string" },
            currentSnapshotId: { type: "string" }
        },
        required: ["previousSnapshotId", "currentSnapshotId"],
        additionalProperties: false
    };
}

function learnIncrementallySchema() {
    return {
        type: "object" as const,
        properties: { application: { type: "string" } },
        required: ["application"],
        additionalProperties: false
    };
}

function azureConnectionSchema() {
    return {
        type: "object" as const,
        properties: {
            organizationUrl: { type: "string" },
            projectName: { type: "string" },
            personalAccessToken: { type: "string" }
        },
        required: ["organizationUrl", "projectName"],
        additionalProperties: false
    };
}

function azureProjectSchema() {
    return {
        type: "object" as const,
        properties: { project: { type: "string" } },
        required: ["project"],
        additionalProperties: false
    };
}

function isMapRequirementArguments(value: unknown): value is MapRequirementArguments {
    return typeof value === "object" && value !== null &&
        "feature" in value && typeof value.feature === "string";
}

function isLearnApplicationArguments(value: unknown): value is LearnApplicationArguments {
    return typeof value === "object" && value !== null &&
        "application" in value && typeof value.application === "string";
}

function isAnalyzeCoverageArguments(value: unknown): value is AnalyzeCoverageArguments {
    return typeof value === "object" && value !== null &&
        "requirement" in value && typeof value.requirement === "string";
}

function isAnalyzeImpactArguments(value: unknown): value is AnalyzeImpactArguments {
    return typeof value === "object" && value !== null &&
        "page" in value && typeof value.page === "string";
}

function isAskQaBrainArguments(value: unknown): value is AskQaBrainArguments {
    return typeof value === "object" && value !== null &&
        "question" in value && typeof value.question === "string";
}

function isReasonAboutRequirementArguments(value: unknown): value is ReasonAboutRequirementArguments {
    return typeof value === "object" && value !== null &&
        "requirement" in value && typeof value.requirement === "string";
}

function isQueryKnowledgeGraphArguments(value: unknown): value is QueryKnowledgeGraphArguments {
    return typeof value === "object" && value !== null &&
        "query" in value && typeof value.query === "string";
}

function isCreateSnapshotArguments(value: unknown): value is CreateSnapshotArguments {
    return typeof value === "object" && value !== null &&
        "application" in value && typeof value.application === "string";
}

function isCompareSnapshotsArguments(value: unknown): value is CompareSnapshotsArguments {
    return typeof value === "object" && value !== null &&
        "previousSnapshotId" in value && typeof value.previousSnapshotId === "string" &&
        "currentSnapshotId" in value && typeof value.currentSnapshotId === "string";
}

function isLearnIncrementallyArguments(value: unknown): value is LearnIncrementallyArguments {
    return isCreateSnapshotArguments(value);
}

function isAzureConnectionArguments(value: unknown): value is AzureConnectionArguments {
    return typeof value === "object" && value !== null &&
        "organizationUrl" in value && typeof value.organizationUrl === "string" &&
        "projectName" in value && typeof value.projectName === "string" &&
        (!("personalAccessToken" in value) || typeof value.personalAccessToken === "string");
}

function isAzureProjectArguments(value: unknown): value is AzureProjectArguments {
    return typeof value === "object" && value !== null &&
        "project" in value && typeof value.project === "string";
}
