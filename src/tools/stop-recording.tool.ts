import { workflowRecorder } from "../workflow/recorder/workflow.recorder.js";
import { workflowBuilder } from "../workflow/builder/workflow.builder.js";
import { workflowMemory } from "../workflow/services/workflow.memory.service.js";
import { logger } from "../utils/logger.js";

export async function stopRecording() {

    const events = workflowRecorder.stop();

    const workflow = workflowBuilder.build(
        "Recorded Workflow",
        "QaBrain",
        events
    );

    workflowMemory.remember(workflow);

    logger.info(workflow, "Workflow Recorded");

    return workflow;

}