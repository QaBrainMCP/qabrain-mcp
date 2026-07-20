export interface BrowserMetadata {
    userAgent: string;
    name?: string | null;
    version?: string | null;
}

export interface Viewport {
    width: number;
    height: number;
}

export interface NetworkFailure {
    url: string;
    status?: number | null;
    method?: string | null;
    failureText?: string | null;
    resourceType?: string | null;
}

export interface ConsoleEntry {
    type: "error" | "warning" | "log" | string;
    text: string;
    location?: { url?: string; line?: number; column?: number } | null;
}

export interface PageState {
    currentUrl: string;
    title: string;
    readyState: string;
    viewport: Viewport;
    browserName?: string | null;
    browserVersion?: string | null;
}

export interface ExecutionContext {
    executionId: string;
    timestamp: number;
    featureName: string;
    scenarioName: string;
    currentStep: string | null;
    previousStep: string | null;
    stepNumber: number;
    phase: "before" | "after";
    screenshotBefore?: string | null;
    screenshotAfter?: string | null;
    dom?: string;
    accessibilityTree?: any;
    pageState?: PageState;
    knownComponents?: string[];
    knownLocators?: string[];
    currentSnapshotId?: string | null;
    browserMetadata?: BrowserMetadata;
    viewport?: Viewport;
    consoleErrors?: ConsoleEntry[];
    consoleWarnings?: ConsoleEntry[];
    networkFailures?: NetworkFailure[];
}

export default ExecutionContext;
