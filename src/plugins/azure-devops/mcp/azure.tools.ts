import { MCPTool } from "../../../mcp/registry/tool.registry.js";
import { connectAzure } from "../tools/connect-azure.tool.js";
import { importProjects } from "../tools/import-project.tool.js";
import { ImportTestCasesInput, importTestCases } from "../tools/import-testcases.tool.js";
import { ImportTestPlansInput, importTestPlans } from "../tools/import-testplans.tool.js";
import { ImportWorkItemsInput, importWorkItems } from "../tools/import-workitems.tool.js";
import { SynchronizeAzureInput, synchronizeAzure } from "../tools/synchronize.tool.js";
import { AzureAuthenticationInput } from "../services/authentication.service.js";

export const azureTools: MCPTool[] = [
    {
        name: "connect_azure",
        description: "Connect QaBrain to Azure DevOps using an organization URL, project, and PAT.",
        async execute(args: AzureAuthenticationInput) { return connectAzure(args); }
    },
    {
        name: "import_projects",
        description: "Import Azure DevOps projects.",
        async execute() { return importProjects(); }
    },
    {
        name: "import_workitems",
        description: "Import Azure DevOps work items and bugs for a project.",
        async execute(args: ImportWorkItemsInput) { return importWorkItems(args); }
    },
    {
        name: "import_testcases",
        description: "Import Azure DevOps test cases for a project.",
        async execute(args: ImportTestCasesInput) { return importTestCases(args); }
    },
    {
        name: "import_testplans",
        description: "Import Azure DevOps test plans and suites for a project.",
        async execute(args: ImportTestPlansInput) { return importTestPlans(args); }
    },
    {
        name: "sync_azure",
        description: "Synchronize Azure DevOps artifacts into the QaBrain knowledge graph.",
        async execute(args: SynchronizeAzureInput) { return synchronizeAzure(args); }
    }
];
