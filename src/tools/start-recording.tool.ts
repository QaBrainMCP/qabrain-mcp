import { workflowRecorder } from "../workflow/recorder/workflow.recorder.js";
import { logger } from "../utils/logger.js";

export async function startRecording() {

    workflowRecorder.start();

    logger.info("Workflow recording started");

}