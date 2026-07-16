import { applicationMapService, ApplicationMapService } from "../../application/services/application-map.service.js";
import { knowledgeRepository, KnowledgeRepository } from "../../knowledge/repository/knowledge.repository.js";
import { logger } from "../../utils/logger.js";
import { workflowMemory, WorkflowMemoryService } from "../../workflow/services/workflow.memory.service.js";
import { VersionRepository, versionRepository } from "../repository/version.repository.js";
import { ApplicationSnapshot, SnapshotPage } from "../models/snapshot.model.js";

export class SnapshotService {
    constructor(
        private readonly repository: VersionRepository = versionRepository,
        private readonly knowledge: KnowledgeRepository = knowledgeRepository,
        private readonly workflows: WorkflowMemoryService = workflowMemory,
        private readonly applicationMap: ApplicationMapService = applicationMapService
    ) {}

    create(application: string): ApplicationSnapshot {
        const pages = this.snapshotPages();
        const snapshot: ApplicationSnapshot = {
            id: crypto.randomUUID(),
            application,
            pages,
            workflows: this.workflows.getAll().map(workflow => ({
                name: workflow.name,
                pages: [...workflow.pages],
                actions: [...workflow.actions],
                locators: [...workflow.locators]
            })),
            createdAt: new Date()
        };
        this.repository.saveSnapshot(snapshot);
        logger.info({ application, snapshotId: snapshot.id }, "Application snapshot created");
        return snapshot;
    }

    private snapshotPages(): SnapshotPage[] {
        const known = this.knowledge.getPages();
        const mapped = this.applicationMap.getMap().pages.filter(page =>
            !known.some(knowledge => knowledge.title === page.title)
        ).map(page => ({ title: page.title, url: page.url, components: [], locators: [] }));
        const detailed = known.map(page => ({
            title: page.title,
            url: page.url,
            components: [
                ...page.buttons, ...page.links, ...page.inputs, ...page.dropdowns,
                ...page.forms, ...page.tables, ...page.dialogs
            ].map(component => component.type === "button" ? `${component.name} Button` : component.name),
            locators: [...page.locators]
        }));
        return [...detailed, ...mapped];
    }
}

export const snapshotService = new SnapshotService();
