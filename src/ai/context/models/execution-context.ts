import { AccessibilityInfo } from "./accessibility-info.js";
import { DomInfo } from "./dom-info.js";
import { PageState } from "./page-state.js";
import { ScreenshotInfo } from "./screenshot-info.js";

export interface ViewportInfo {
    width: number;
    height: number;
}

export interface KnowledgeSummary {
    knownPage: boolean;
    knownComponents: number;
    knownLocators: number;
    snapshotVersion: string | null;
}

export interface ExecutionContext {
    featureName: string;
    scenarioName: string;
    stepNumber: number;
    featureStep: string;
    previousStep: string | null;
    timestamp: string;
    browser: string;
    currentUrl: string;
    pageTitle: string;
    viewport: ViewportInfo;
    pageState: PageState;
    knowledgeSummary: KnowledgeSummary;
    dom: DomInfo;
    accessibility: AccessibilityInfo;
    beforeScreenshot: ScreenshotInfo | null;
    afterScreenshot: ScreenshotInfo | null;
}
