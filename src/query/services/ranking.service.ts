import { SearchMatch } from "../models/query-result.model.js";

export class RankingService {
    rank(matches: readonly SearchMatch[]): SearchMatch[] {
        const unique = matches.filter((match, index) =>
            matches.findIndex(item => item.label === match.label) === index
        );
        return [...unique].sort((left, right) =>
            right.relevance - left.relevance || left.label.localeCompare(right.label)
        );
    }
}

export const rankingService = new RankingService();
