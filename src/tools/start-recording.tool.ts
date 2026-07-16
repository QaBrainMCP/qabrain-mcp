import { workflowRecorder } from "../workflow/recorder/workflow.recorder.js";
import { applicationMapService } from "../application/services/application-map.service.js";
import { logger } from "../utils/logger.js";

export async function startRecording(application: string) {

    applicationMapService.create(application);

    workflowRecorder.start();

    logger.info(`Recording ${application}`);

}