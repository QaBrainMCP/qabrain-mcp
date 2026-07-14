import { Page } from "playwright";
import { WorkflowEvent } from "../events/workflow.event.js";
import { logger } from "../../utils/logger.js";

export class WorkflowRecorder {

    private recording = false;

    private events: WorkflowEvent[] = [];

    start(): void {

        this.recording = true;

        this.events = [];

        logger.info("Workflow Recording Started");

    }

    stop(): WorkflowEvent[] {

        this.recording = false;

        logger.info("Workflow Recording Stopped");

        return this.events;

    }

    attach(page: Page): void {

        page.on("framenavigated", async (frame) => {

            if (!this.recording) {
                return;
            }

            if (frame !== page.mainFrame()) {
                return;
            }

            this.record({
                timestamp: new Date(),
                type: "NAVIGATION",
                pageTitle: await page.title(),
                url: page.url(),
                action: "Navigate"
            });

        });

    }

    record(event: WorkflowEvent): void {

        if (!this.recording) {
            return;
        }

        this.events.push(event);

        logger.info(event, "Workflow Event Recorded");

    }

    getEvents(): WorkflowEvent[] {

        return this.events;

    }

    clear(): void {

        this.events = [];

    }

    isRecording(): boolean {

        return this.recording;

    }

}

export const workflowRecorder = new WorkflowRecorder();