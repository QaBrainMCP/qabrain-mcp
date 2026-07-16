import { Query } from "./query.model.js";

export interface QueryResult {
    query: Query;
    answer: string;
    results: string[];
    confidence: number;
}

export interface SearchMatch {
    label: string;
    source: string;
    relevance: number;
}
