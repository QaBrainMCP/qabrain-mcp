export interface LocatorSummary {
    locatorId: string;
    strategy: string;
    locator: string;
    confidence?: number;
    lastValidated?: string;
    isPrimary?: boolean;
}

export interface ComponentContext {
    componentId: string;
    businessName?: string;
    automationName: string;
    componentType?: string;
    role?: string;
    required?: boolean;
    primaryLocator?: LocatorSummary | null;
    alternativeLocators: LocatorSummary[];
    confidence?: number;
    lastValidated?: string;
    visibility?: string;
    dependencies: string[];
}

export default ComponentContext;
