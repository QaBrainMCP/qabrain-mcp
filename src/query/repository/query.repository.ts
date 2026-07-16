import { QueryResult } from "../models/query-result.model.js";

export class QueryRepository {
    private results: QueryResult[] = [];

    save(result: QueryResult): QueryResult {
        this.results.push(result);
        return result;
    }

    getAll(): QueryResult[] {
        return [...this.results];
    }

    clear(): void {
        this.results = [];
    }
}

export const queryRepository = new QueryRepository();
