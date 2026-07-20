import { ApplicationComponentModel } from "./component-model.js";

export interface PageModel {
    id: string;
    title: string;
    url: string;
    module: string | null;
    expectedHeadings: string[];
    components: ApplicationComponentModel[];
    knownLocators: string[];
    visitCount: number;
    lastSeenAt: string;
}
