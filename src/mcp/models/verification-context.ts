export interface VerificationContext {
    expectedHeading?: string | null;
    expectedUrl?: string | null;
    expectedBreadcrumb?: string | null;
    expectedTable?: string | null;
    expectedLabels?: string[];
    expectedToast?: string | null;
}

export default VerificationContext;
