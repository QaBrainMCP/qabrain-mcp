import type { MCPTool } from "../registry/tool.registry.js";
import { promises as fs } from "node:fs";
import { featureParserService } from "../../feature-learning/services/feature-parser.service.js";
import { scenarioPlannerService } from "../../feature-learning/services/scenario-planner.service.js";
import { flowExecutorService } from "../../feature-learning/services/flow-executor.service.js";
import { knowledgeRepository } from "../../knowledge/repository/knowledge.repository.js";
import { knowledgeStoreService } from "../../knowledge/store/knowledge-store.service.js";
import { snapshotService } from "../../snapshot/services/snapshot.service.js";
import { logger } from "../../utils/logger.js";

export interface LearnFeatureRequest {
    featurePath: string;
    applicationName?: string;
    environment?: string;
    validateLocators?: boolean;
    updateRepository?: boolean;
    createSnapshot?: boolean;
    forceRediscovery?: boolean;
}

export const LearnFeatureTool: MCPTool<LearnFeatureRequest> = {
    name: "learn_feature",
    description: "Orchestrate feature learning pipeline for a feature file",
    async execute(input: LearnFeatureRequest) {
        const start = Date.now();
        logger.info("================================");
        logger.info("QaBrain Learning Pipeline");
        logger.info("================================");

        // apply defaults
        const opts = {
            validateLocators: true,
            updateRepository: true,
            createSnapshot: true,
            forceRediscovery: false,
            ...input
        } as LearnFeatureRequest & Required<Pick<LearnFeatureRequest, "validateLocators" | "updateRepository" | "createSnapshot" | "forceRediscovery">>;

        const response: any = {
            status: "ok",
            message: "",
            executionTime: 0,
            repository: {},
            learning: {},
            validation: {},
            snapshot: {},
            summary: {}
        };

        try {
            logger.info({ feature: opts.featurePath }, "Loading Feature");
            const exists = await fs.stat(opts.featurePath).then(() => true).catch(() => false);
            if (!exists) {
                throw new Error(`Feature file not found: ${opts.featurePath}`);
            }

            const featureModel = await featureParserService.parseFile(opts.featurePath);
            logger.info({ feature: featureModel.name }, "Planning");
            const plans = scenarioPlannerService.planFeature(featureModel);

            // ensure store loaded
            try { await knowledgeStoreService.load(); } catch {}

            logger.info("Learning");
            const perScenarioResults: any[] = [];
            let aggregate = { pagesLearned: 0, pagesReused: 0, componentsLearned: 0, componentsReused: 0, newComponents: 0, updatedComponents: 0, validatedLocators: 0, locatorReuseCount: 0, discoverySkipped: 0 };

            for (const scenario of featureModel.scenarios) {
                logger.info({ scenario: scenario.name }, "Executing scenario");
                const result = await flowExecutorService.executeScenario(featureModel, scenario, { captureScreenshots: false });

                // attempt to extract counts from result
                const stepResults = (result as any).stepResults ?? [];
                const learnedPages = (result as any).learnedPages ?? 0;
                const learnedComponents = (result as any).learnedComponents ?? 0;
                const validatedLocators = (result as any).validatedLocators ?? 0;
                const aiCalls = (result as any).aiCalls ?? 0;

                aggregate.pagesLearned += learnedPages;
                aggregate.componentsLearned += learnedComponents;
                aggregate.validatedLocators += validatedLocators;

                // count new/updated from final summary if present
                const summary = (result as any).summary ?? {};
                aggregate.newComponents += summary.knowledgeUpdates?.newComponents ?? 0;
                aggregate.updatedComponents += summary.knowledgeUpdates?.updatedComponents ?? 0;

                perScenarioResults.push({ scenario: scenario.name, result });
            }

            // repository snapshot of counts
            const repoPages = Object.keys((knowledgeStoreService as any).pages ?? {}).length;
            const repoComponents = Object.keys((knowledgeStoreService as any).components ?? {}).length;
            const repoLocators = Object.keys((knowledgeStoreService as any).locators ?? {}).length;

            response.repository = {
                pagesLoaded: repoPages,
                componentsLoaded: repoComponents,
                locatorsLoaded: repoLocators
            };

            response.learning = aggregate;
            response.validation = { validated: aggregate.validatedLocators, failed: 0, skipped: 0, averageConfidence: 0 };

            // snapshot
            if (opts.createSnapshot) {
                try {
                    const applicationName = opts.applicationName ?? featureModel.name ?? "application";
                    logger.info({ application: applicationName }, "Snapshot");
                    const snap = snapshotService.createSnapshot(applicationName);
                    response.snapshot = { created: true, snapshotId: snap.id, version: snap.version, pageCount: snap.pages.length };
                } catch (err) {
                    response.snapshot = { created: false, error: String(err) };
                }
            }

            response.summary = {
                application: opts.applicationName ?? featureModel.name,
                feature: featureModel.name,
                scenarios: featureModel.scenarios.length,
                pagesLearned: aggregate.pagesLearned,
                componentsLearned: aggregate.componentsLearned,
                newComponents: aggregate.newComponents,
                updatedComponents: aggregate.updatedComponents,
                validatedLocators: aggregate.validatedLocators,
                executionDuration: Date.now() - start
            };

            response.message = "Learning completed";
            response.executionTime = Date.now() - start;
            response.learningDetails = perScenarioResults;

            logger.info("Completed");
            return response;
        } catch (error) {
            logger.error({ err: error }, "learn_feature tool failed");
            return { status: "failed", message: String(error), partial: response, executionTime: Date.now() - start };
        }
    }
};
