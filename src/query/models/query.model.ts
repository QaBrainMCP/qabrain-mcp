export type QueryIntent =
    | "PAGES_BY_COMPONENT"
    | "WORKFLOW"
    | "UNCOVERED_REQUIREMENTS"
    | "WORKFLOWS_BY_PAGE"
    | "PAGES_WITH_FORMS"
    | "PAGES_BY_TERM"
    | "AFFECTED_REQUIREMENTS"
    | "APPLICATION_KNOWLEDGE"
    | "APPLICATIONS"
    | "LOCATORS_BY_PAGE"
    | "UNKNOWN";

export interface Query {
    question: string;
    intent: QueryIntent;
    subject: string | null;
}
