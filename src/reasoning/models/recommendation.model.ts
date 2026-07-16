export type RecommendationType =
    | "VALIDATION"
    | "WORKFLOW"
    | "PAGE"
    | "NAVIGATION"
    | "COVERAGE"
    | "REGRESSION"
    | "MAPPING"
    | "DUPLICATE"
    | "REACHABILITY";

export interface Recommendation {
    type: RecommendationType;
    message: string;
}
