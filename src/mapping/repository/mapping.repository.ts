import { RequirementMapping } from "../models/requirement-mapping.model.js";

export class MappingRepository {
    private mappings: RequirementMapping[] = [];

    save(mapping: RequirementMapping): RequirementMapping {
        this.mappings.push(mapping);
        return mapping;
    }

    getAll(): RequirementMapping[] {
        return [...this.mappings];
    }

    clear(): void {
        this.mappings = [];
    }
}

export const mappingRepository = new MappingRepository();
