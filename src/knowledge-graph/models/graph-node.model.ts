export type GraphNodeType =
    | "Application"
    | "Page"
    | "Component"
    | "Requirement"
    | "Workflow"
    | "Locator"
    | "Coverage"
    | "Impact"
    | "Recommendation"
    | "Project"
    | "Repository"
    | "WorkItem"
    | "TestPlan"
    | "TestSuite"
    | "TestCase"
    | "Bug"
    | "Iteration"
    | "Area";

export interface GraphNode {
    id: string;
    type: GraphNodeType;
    label: string;
}
