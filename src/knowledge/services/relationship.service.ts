import { logger } from "../../utils/logger.js";
import { PageKnowledge } from "../models/page-knowledge.model.js";
import { Relationship } from "../models/relationship.model.js";
import { KnowledgeRepository } from "../repository/knowledge.repository.js";

export class RelationshipService {
    constructor(private readonly repository: KnowledgeRepository) {}

    learnNavigation(source: PageKnowledge | undefined, target: PageKnowledge): Relationship | null {
        if (!source || source.id === target.id) {
            return null;
        }
        const relationship: Relationship = {
            id: crypto.randomUUID(),
            sourcePageId: source.id,
            targetPageId: target.id,
            type: "NAVIGATION",
            createdAt: new Date()
        };
        this.repository.saveRelationship(relationship);
        logger.info({ relationship }, "Navigation relationship learned");
        return relationship;
    }
}
