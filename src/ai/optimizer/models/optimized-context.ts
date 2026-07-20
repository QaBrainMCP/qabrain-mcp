import { PageState } from "../../context/models/page-state.js";

export interface DomSummary {
    title: string;
    bodyTextLength: number;
    forms: number;
    buttons: number;
    links: number;
}

export interface InteractiveComponentsSummary {
    visibleInteractiveElements: string[];
    forms: number;
    buttons: number;
    inputs: number;
    links: number;
    menus: string[];
    headings: string[];
    tables: number;
    dialogs: number;
    alerts: number;
    navigationItems: string[];
}

export interface NavigationSummary {
    currentUrl: string;
    pageTitle: string;
    currentModule: string | null;
    currentActiveMenu: string | null;
}

export interface OptimizedContext {
    featureName: string;
    scenarioName: string;
    stepNumber: number;
    featureStep: string;
    currentUrl: string;
    pageTitle: string;
    pageState: PageState;
    knownComponents: number;
    knownLocators: number;
    screenshotPath: string | null;
    domSummary: DomSummary;
    interactiveComponentsSummary: InteractiveComponentsSummary;
    navigationSummary: NavigationSummary;
    cleanedDom: string;
}
