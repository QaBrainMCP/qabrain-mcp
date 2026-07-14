export type StepKeyword =
    | "Given"
    | "When"
    | "Then"
    | "And"
    | "But";

export interface Step {

    keyword: StepKeyword;

    text: string;

}