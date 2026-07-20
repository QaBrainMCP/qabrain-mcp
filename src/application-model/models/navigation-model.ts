export interface NavigationModel {
    fromPage: string;
    toPage: string;
    viaComponent: string | null;
    businessIntent: string;
    expectedDestination: string | null;
    learnedCount: number;
    lastUsedAt: string;
}
