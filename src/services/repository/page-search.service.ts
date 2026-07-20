import { knowledgeStoreService } from "../../knowledge/store/knowledge-store.service.js";
import { logger } from "../../utils/logger.js";
import type PageRecord from "../../knowledge/store/page-record.js";

export interface PageSearchResult {
    found: boolean;
    confidence: number;
    matchType: string;
    page?: PageRecord;
    alternatives: PageRecord[];
}

const aliasMap: Record<string, string[]> = {
    login: ["authentication", "sign in", "orangehrm login"],
    dashboard: ["home"],
    pim: ["employee information", "employee-information"]
};

export class PageSearchService {
    normalize(text: string | undefined) {
        if (!text) return "";
        return text
            .toString()
            .trim()
            .replace(/[-_]+/g, " ")
            .replace(/\s+/g, " ")
            .toLowerCase();
    }

    private allPages(): PageRecord[] {
        const raw = (knowledgeStoreService as any).pages ?? {};
        return Object.values(raw) as PageRecord[];
    }

    search(pageName: string) {
        logger.info({ query: pageName }, "Search Started");
        const normQ = this.normalize(pageName);
        const pages = this.allPages();
        const results: PageSearchResult[] = [];

        for (const p of pages) {
            const candidates = [p.pageName ?? "", p.title ?? "", p.urlPattern ?? ""];
            let matched = false;

            for (const candidate of candidates) {
                const name = candidate;
                const normName = this.normalize(name);

                // exact
                if (name === pageName) {
                    results.push({ found: true, confidence: 100, matchType: "exact", page: p, alternatives: [] });
                    matched = true;
                    break;
                }

                // case-insensitive
                if ((name ?? "").toLowerCase() === pageName.toLowerCase()) {
                    results.push({ found: true, confidence: 99, matchType: "case-insensitive", page: p, alternatives: [] });
                    matched = true;
                    break;
                }

                // normalized
                if (normName === normQ && normName) {
                    results.push({ found: true, confidence: 97, matchType: "normalized", page: p, alternatives: [] });
                    matched = true;
                    break;
                }

                // partial
                if (normName.includes(normQ) || normQ.includes(normName)) {
                    results.push({ found: true, confidence: 90, matchType: "partial", page: p, alternatives: [] });
                    matched = true;
                    break;
                }

                // alias
                for (const [key, aliases] of Object.entries(aliasMap)) {
                    if (key === normQ || aliases.includes(normQ)) {
                        const keyNorm = this.normalize(key);
                        if (normName.includes(keyNorm) || keyNorm.includes(normName) || aliases.some(a => this.normalize(a) === normName)) {
                            results.push({ found: true, confidence: 85, matchType: "alias", page: p, alternatives: [] });
                            matched = true;
                            break;
                        }
                    }
                }

                if (matched) break;
            }
        }

        // sort by confidence desc
        results.sort((a, b) => b.confidence - a.confidence);

        logger.info({ query: pageName, matches: results.length }, "Search Completed");

        return results.map(r => ({
            found: r.found,
            confidence: r.confidence,
            matchType: r.matchType,
            page: r.page
        } as PageSearchResult));
    }

    findBestMatch(pageName: string): PageSearchResult {
        const results = this.search(pageName);
        if (results.length === 0) {
            return { found: false, confidence: 0, matchType: "none", alternatives: [] };
        }

        const best = results[0];
        const alternatives = results.slice(1).map(r => r.page!).filter(Boolean);

        logger.info({ query: pageName, bestMatchType: best.matchType, confidence: best.confidence }, "Matching Strategy");

        return {
            found: true,
            confidence: best.confidence,
            matchType: best.matchType,
            page: best.page,
            alternatives
        } as PageSearchResult;
    }
}

export const pageSearchService = new PageSearchService();
