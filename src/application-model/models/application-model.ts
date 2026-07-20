import { BusinessIntentType } from "./business-intent.js";
import { NavigationModel } from "./navigation-model.js";
import { PageModel } from "./page-model.js";

export interface ApplicationModel {
    pages: PageModel[];
    modules: string[];
    navigation: NavigationModel[];
    businessActions: BusinessIntentType[];
    updatedAt: string;
}
