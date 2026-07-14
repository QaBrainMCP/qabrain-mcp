export interface WorkflowEvent {

    timestamp: Date;

    type: "NAVIGATION" | "CLICK" | "INPUT";

    pageTitle: string;

    url: string;

    action: string;

    element?: string;

    locator?: string;

}