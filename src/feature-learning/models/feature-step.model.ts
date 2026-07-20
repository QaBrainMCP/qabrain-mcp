export type FeatureStepKeyword =
    | "Given"
    | "When"
    | "Then"
    | "And"
    | "But";

export interface FeatureStep {
    keyword: FeatureStepKeyword;
    text: string;
    lineNumber: number;
    variables: string[];
}
