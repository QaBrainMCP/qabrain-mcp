import { ExecutionStep } from "../../feature-learning/models/execution-step.model.js";
import { KnowledgeRepository, knowledgeRepository } from "../../knowledge/repository/knowledge.repository.js";
import { StepAnalysis } from "./step-analysis.js";

interface StepAnalyzerDependencies {
    knowledgeRepository?: KnowledgeRepository;
}

function mapActionType(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes("click") || lower.includes("select") || lower.includes("press")) return "CLICK";
    if (lower.includes("enter") || lower.includes("type") || lower.includes("fill") || lower.includes("set")) return "INPUT";
    if (lower.includes("see") || lower.includes("should see") || lower.includes("verify") || lower.includes("expect")) return "VERIFY";
    if (lower.includes("go to") || lower.includes("navigate") || lower.includes("open") || lower.includes("visit")) return "NAVIGATE";
    if (lower.includes("wait") || lower.includes("loading") || lower.includes("spinner")) return "WAIT";
    if (lower.includes("close") || lower.includes("dismiss")) return "CLOSE";
    return "UNKNOWN";
}

function mapBusinessIntent(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes("login") || lower.includes("username") || lower.includes("password") || lower.includes("sign in") || lower.includes("authenticate")) return "Authenticate User";
    if (lower.includes("pim") || lower.includes("employee") || lower.includes("people")) return "Navigate To Employee Management";
    if (lower.includes("dashboard") || lower.includes("home page") || lower.includes("landing")) return "Verify Successful Login";
    if (lower.includes("enter") || lower.includes("type") || lower.includes("fill")) return "Populate Login Credentials";
    if (lower.includes("search") || lower.includes("find")) return "Search Records";
    if (lower.includes("logout") || lower.includes("sign out")) return "Sign Out User";
    return "Perform Step";
}

export class StepAnalyzerService {
    private readonly knowledgeRepository: KnowledgeRepository;

    constructor(dependencies: StepAnalyzerDependencies = {}) {
        this.knowledgeRepository = dependencies.knowledgeRepository ?? knowledgeRepository;
    }

    analyze(featureStep: ExecutionStep | any, executionContext: any, pageState: any): StepAnalysis {
        const text = featureStep?.originalStep?.text ?? featureStep?.text ?? String(featureStep);

        const actionType = mapActionType(text);
        const businessIntent = mapBusinessIntent(text);

        // Target extraction heuristics
        let target: string | null = null;
        const clickMatch = text.match(/click(?: on| the)?\s+"?([\w\- \>\:\.]+)"?/i);
        const enterMatch = text.match(/enter(?: the)?\s+"?([\w\- ]+)"?(?: into| in| to)?\s*"?([\w\- ]+)?"?/i);
        const seeMatch = text.match(/see(?: the)?\s+"?([\w\- ]+)"?/i);
        if (clickMatch) target = clickMatch[1].trim();
        else if (enterMatch) target = (enterMatch[2] || enterMatch[1])?.trim() ?? null;
        else if (seeMatch) target = seeMatch[1].trim();
        else {
            const q = text.match(/"([^"]+)"/);
            if (q) target = q[1];
        }

        const expectedPage = pageState?.pageName ?? pageState?.currentPage ?? executionContext?.page?.url ?? null;

        // Determine expected components using knowledge repository when possible
        const expectedComponents: string[] = [];
        const optionalComponents: string[] = [];
        const ignoredComponents: string[] = [];

        if (target) expectedComponents.push(target);

        // Use known page components to refine expected/ignored lists
        try {
            const page = this.knowledgeRepository.getPageByUrl(executionContext?.page?.url || expectedPage || "") || this.knowledgeRepository.getPages()[0];
            if (page) {
                // Mark clearly unrelated components as ignored: images, footers, charts, widgets
                ignoredComponents.push("Footer", "Logo", "Images", "Charts", "Widgets");

                // If a target matches a known component name, prefer that exact name
                if (target) {
                    const lowerTarget = target.toLowerCase();
                    page.buttons.forEach(b => {
                        if (b.name && b.name.toLowerCase().includes(lowerTarget)) expectedComponents[0] = b.name;
                    });
                    page.links.forEach(l => {
                        if (l.name && l.name.toLowerCase().includes(lowerTarget)) expectedComponents[0] = l.name;
                    });
                }

                // Add commonly related optional components (like username field when logging in)
                if (businessIntent === "Authenticate User") {
                    optionalComponents.push("Username Field", "Password Field", "Remember Me Checkbox");
                }
            }
        } catch (err) {
            // noop
        }

        // Prerequisite detection from pageState
        const prerequisites: string[] = [];
        if (pageState?.modalOpen) prerequisites.push("Close Modal");
        if (pageState?.dialogOpen) prerequisites.push("Close Dialog");
        if (pageState?.loading || pageState?.loadingSpinner || pageState?.spinnerVisible) prerequisites.push("Wait For Spinner");
        if (pageState?.sidebarVisible === false && text.toLowerCase().includes("pim")) prerequisites.push("Expand Sidebar");

        // Confidence heuristics
        let confidence = 60;
        if (target) confidence += 20;
        if (expectedPage) confidence += 10;
        if (prerequisites.length > 0) confidence -= 5;
        if (confidence > 95) confidence = 95;
        if (confidence < 10) confidence = 10;

        const reasoningLines: string[] = [];
        reasoningLines.push(`Current Page: ${expectedPage ?? "unknown"}`);
        reasoningLines.push(`Feature Step: ${text}`);
        reasoningLines.push(`Business Intent: ${businessIntent}`);
        if (prerequisites.length) reasoningLines.push(`Prerequisites: ${prerequisites.join(", ")}`);
        reasoningLines.push(`Required Action: ${actionType}`);
        reasoningLines.push(`Target Component: ${target ?? "<none>"}`);
        reasoningLines.push(`Expected Result: ${businessIntent}`);

        const analysis: StepAnalysis = {
            businessIntent,
            actionType,
            targetComponent: target ?? null,
            expectedPage: expectedPage ?? null,
            expectedComponents,
            optionalComponents,
            ignoredComponents,
            prerequisites,
            confidence,
            reasoning: reasoningLines.join("\n")
        };

        // Logging block required by spec
        console.log("--------------------------------");
        console.log("Feature Step: ", text);
        console.log("Business Intent: ", analysis.businessIntent);
        console.log("Action Type: ", analysis.actionType);
        console.log("Target Component: ", analysis.targetComponent ?? '<none>');
        console.log("Prerequisites: ", analysis.prerequisites.join(", ") || '<none>');
        console.log("Expected Components: ", analysis.expectedComponents.join(", ") || '<none>');
        console.log("Ignored Components: ", analysis.ignoredComponents.join(", ") || '<none>');
        console.log("Expected Page: ", analysis.expectedPage ?? '<none>');
        console.log("Confidence: ", analysis.confidence);
        console.log("--------------------------------");

        return analysis;
    }
}

export const stepAnalyzerService = new StepAnalyzerService();
