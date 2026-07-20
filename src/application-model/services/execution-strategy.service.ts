import { KnowledgeRepository, knowledgeRepository } from "../../knowledge/repository/knowledge.repository.js";
import { BusinessIntent } from "../models/business-intent.js";
import { ExecutionStrategy, StrategyAction } from "../models/execution-strategy.js";
import { ApplicationModel } from "../models/application-model.js";
import { ExecutionStep } from "../../feature-learning/models/execution-step.model.js";

interface StrategyInput {
    intent: BusinessIntent;
    currentUrl: string;
    currentPage: string;
    step: ExecutionStep;
    model: ApplicationModel;
}

export class ExecutionStrategyService {
    private readonly knowledgeRepository: KnowledgeRepository;

    constructor(knowledgeRepositoryDependency?: KnowledgeRepository) {
        this.knowledgeRepository = knowledgeRepositoryDependency ?? knowledgeRepository;
    }

    build(input: StrategyInput): ExecutionStrategy {
        const actions: StrategyAction[] = [];

        actions.push({
            type: "VERIFY_CURRENT_PAGE",
            description: `Verify current page '${input.currentPage}' before action`,
            target: input.currentPage
        });

        if (input.intent.type === "NAVIGATE_TO_MODULE") {
            actions.push({
                type: "EXPAND_SIDEBAR",
                description: "Expand sidebar if required",
                target: null
            });
        }

        actions.push({
            type: "LOCATE_TARGET",
            description: `Locate target '${input.intent.target ?? input.step.target ?? "step-target"}'`,
            target: input.intent.target ?? input.step.target
        });

        actions.push({
            type: "VALIDATE_LOCATOR",
            description: "Validate locator before execution",
            target: input.intent.target ?? input.step.target
        });

        actions.push({
            type: "EXECUTE_STEP",
            description: `Execute step action '${input.step.actionType}'`,
            target: input.intent.target ?? input.step.target
        });

        actions.push({
            type: "VERIFY_EXPECTATION",
            description: "Verify expected destination/state",
            target: input.step.expectedState ?? input.step.target
        });

        const currentPageKnown = Boolean(this.knowledgeRepository.getPageByUrl(input.currentUrl));
        const knownNavigation = input.model.navigation.find(edge =>
            edge.fromPage === input.currentUrl &&
            edge.businessIntent === input.intent.type &&
            (input.intent.target ? edge.viaComponent?.toLowerCase() === input.intent.target.toLowerCase() : true)
        );

        let confidence = input.intent.confidence;
        if (currentPageKnown) confidence += 10;
        if (knownNavigation) confidence += 10;
        if (input.intent.type === "CUSTOM_FLOW") confidence = Math.min(confidence, 60);
        confidence = Math.max(0, Math.min(100, confidence));

        return {
            goal: `Execute '${input.step.actionType}' for '${input.intent.target ?? input.step.target ?? "step"}'`,
            businessIntent: input.intent.type,
            actions,
            confidence,
            expectedDestination: input.step.expectedState ?? input.step.target,
            reason: knownNavigation
                ? "Known navigation relationship available"
                : "Built strategy from intent and current page knowledge"
        };
    }
}

export const executionStrategyService = new ExecutionStrategyService();
