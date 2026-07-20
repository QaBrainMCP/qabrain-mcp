export type ApplicationComponentType =
    | "button"
    | "link"
    | "input"
    | "dropdown"
    | "form"
    | "table"
    | "dialog"
    | "unknown";

export interface ApplicationComponentModel {
    name: string;
    type: ApplicationComponentType;
    locators: string[];
    businessActions: string[];
}
