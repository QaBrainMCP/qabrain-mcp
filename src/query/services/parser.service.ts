import { Query, QueryIntent } from "../models/query.model.js";

export class ParserService {
    parse(question: string): Query {
        const normalized = question.trim().replace(/\?$/, "");
        const intent = this.intentFor(normalized);
        return { question, intent, subject: this.subjectFor(normalized, intent) };
    }

    private intentFor(question: string): QueryIntent {
        const lower = question.toLowerCase();
        if (lower.includes("pages contain") && lower.includes("button")) return "PAGES_BY_COMPONENT";
        if (lower.startsWith("show") && lower.includes("workflow")) return "WORKFLOW";
        if (lower.includes("requirements") && lower.includes("uncovered")) return "UNCOVERED_REQUIREMENTS";
        if (lower.includes("workflows") && lower.includes("use")) return "WORKFLOWS_BY_PAGE";
        if (lower.includes("components") && lower.includes("forms")) return "PAGES_WITH_FORMS";
        if (lower.includes("pages have")) return "PAGES_BY_TERM";
        if (lower.includes("requirements") && lower.includes("affected by")) return "AFFECTED_REQUIREMENTS";
        if (lower.includes("application knowledge")) return "APPLICATION_KNOWLEDGE";
        if (lower.includes("remembered applications")) return "APPLICATIONS";
        if (lower.includes("locators") && lower.includes("for")) return "LOCATORS_BY_PAGE";
        return "UNKNOWN";
    }

    private subjectFor(question: string, intent: QueryIntent): string | null {
        const patterns: Partial<Record<QueryIntent, RegExp>> = {
            PAGES_BY_COMPONENT: /contain\s+(.+?)\s+button/i,
            WORKFLOW: /show\s+(.+?)\s+workflow/i,
            WORKFLOWS_BY_PAGE: /use\s+(.+)$/i,
            PAGES_BY_TERM: /pages have\s+(.+)$/i,
            AFFECTED_REQUIREMENTS: /affected by\s+(.+)$/i,
            LOCATORS_BY_PAGE: /for\s+(.+?)\s+page$/i
        };
        const match = patterns[intent]?.exec(question);
        return match?.[1]?.trim() ?? null;
    }
}

export const queryParser = new ParserService();
