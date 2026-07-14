import { WorkflowEvent } from "../events/workflow.event.js";
import { Workflow } from "../models/workflow.model.js";

export class WorkflowBuilder {

    build(
        name: string,
        application: string,
        events: WorkflowEvent[]
    ): Workflow {

        return {

            id: crypto.randomUUID(),

            name,

            application,

            pages: [...new Set(events.map(e => e.pageTitle))],

            actions: events.map(e => e.action),

            locators: [],

            createdAt: new Date()

        };

    }

}

export const workflowBuilder = new WorkflowBuilder();