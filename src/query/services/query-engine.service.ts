import { logger } from "../../utils/logger.js";
import { QueryResult } from "../models/query-result.model.js";
import { queryRepository, QueryRepository } from "../repository/query.repository.js";
import { queryParser, ParserService } from "./parser.service.js";
import { rankingService, RankingService } from "./ranking.service.js";
import { knowledgeSearch, SearchService } from "./search.service.js";

export class QueryEngineService {
    constructor(
        private readonly repository: QueryRepository = queryRepository,
        private readonly parser: ParserService = queryParser,
        private readonly search: SearchService = knowledgeSearch,
        private readonly ranking: RankingService = rankingService
    ) {}

    ask(question: string): QueryResult {
        logger.info({ question }, "Processing QaBrain query");
        const query = this.parser.parse(question);
        const matches = this.ranking.rank(this.search.search(query));
        const result: QueryResult = {
            query,
            answer: this.answer(query.intent, matches.map(match => match.label)),
            results: matches.map(match => match.label),
            confidence: this.confidence(matches.map(match => match.relevance))
        };

        this.repository.save(result);
        logger.info({ intent: query.intent, resultCount: result.results.length }, "QaBrain query completed");
        return result;
    }

    private answer(intent: string, results: readonly string[]): string {
        if (results.length === 0) {
            return "No remembered knowledge matches this question.";
        }
        const labels: Record<string, string> = {
            PAGES_BY_COMPONENT: "Pages",
            PAGES_BY_TERM: "Pages",
            WORKFLOW: "Workflows",
            UNCOVERED_REQUIREMENTS: "Uncovered requirements",
            WORKFLOWS_BY_PAGE: "Workflows",
            PAGES_WITH_FORMS: "Pages with forms",
            AFFECTED_REQUIREMENTS: "Affected requirements",
            APPLICATION_KNOWLEDGE: "Application knowledge",
            APPLICATIONS: "Remembered applications",
            LOCATORS_BY_PAGE: "Locators"
        };
        return `${labels[intent] ?? "Results"}: ${results.join(", ")}`;
    }

    private confidence(relevance: readonly number[]): number {
        if (relevance.length === 0) return 0;
        const average = relevance.reduce((total, score) => total + score, 0) / relevance.length;
        return Math.round(90 + (average * 0.07));
    }
}

export const queryEngineService = new QueryEngineService();
