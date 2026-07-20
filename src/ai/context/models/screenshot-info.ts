export type ScreenshotPhase = "before" | "after";

export interface ScreenshotInfo {
    phase: ScreenshotPhase;
    path: string;
    capturedAt: string;
}
