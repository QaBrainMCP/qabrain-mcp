export type BusinessIntentType =
    | "LOGIN"
    | "NAVIGATE_TO_MODULE"
    | "SAVE_FORM"
    | "SEARCH_EMPLOYEE"
    | "NAVIGATE_TO_APPLICATION"
    | "INPUT_VALUE"
    | "VERIFY_STATE"
    | "CUSTOM_FLOW";

export interface BusinessIntent {
    type: BusinessIntentType;
    target: string | null;
    confidence: number;
    reason: string;
}
