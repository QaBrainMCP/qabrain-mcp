import { CoverageRecord } from "../../coverage/repository/coverage.repository.js";

export class RequirementImpactService {
    find(changed: string, affectedPages: readonly string[], records: readonly CoverageRecord[]): CoverageRecord[] {
        return records.filter(record =>
            record.pages.some(page => this.matches(changed, page) || affectedPages.some(affected => this.matches(affected, page))) ||
            record.elements.some(element => this.matches(changed, element))
        );
    }

    private matches(expected: string, actual: string): boolean {
        return actual.toLowerCase().includes(expected.toLowerCase()) ||
            expected.toLowerCase().includes(actual.toLowerCase());
    }
}
