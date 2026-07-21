import { DiscoveryResult } from "./types.js";

export class KnowledgeBuilder {
    async build(result: DiscoveryResult) {
        // Transform discovery findings into repository records.
        // For now this is a passthrough and will be extended.
        return result;
    }
}

export const knowledgeBuilder = new KnowledgeBuilder();
