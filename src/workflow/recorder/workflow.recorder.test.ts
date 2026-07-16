import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkflowRecorder } from "./workflow.recorder.js";
import { applicationMapService } from "../../application/services/application-map.service.js";
import { applicationExplorer } from "../../application/explorer/application.explorer.js";

vi.mock("../../application/services/application-map.service.js", () => ({
    applicationMapService: {
        rememberCurrentPage: vi.fn()
    }
}));

vi.mock("../../application/explorer/application.explorer.js", () => ({
    applicationExplorer: {
        explore: vi.fn()
    }
}));

describe("WorkflowRecorder", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("records events only while recording is active", () => {
        const recorder = new WorkflowRecorder();
        recorder.record({
            timestamp: new Date(),
            type: "NAVIGATION",
            pageTitle: "Home",
            url: "/",
            action: "Navigate"
        });

        expect(recorder.getEvents()).toEqual([]);
    });

    it("starts and stops recording and clears the event list", () => {
        const recorder = new WorkflowRecorder();
        recorder.start();
        recorder.record({
            timestamp: new Date(),
            type: "NAVIGATION",
            pageTitle: "Home",
            url: "/",
            action: "Navigate"
        });

        const events = recorder.stop();

        expect(recorder.isRecording()).toBe(false);
        expect(events).toHaveLength(1);
        expect(recorder.getEvents()).toHaveLength(1);
    });
});
