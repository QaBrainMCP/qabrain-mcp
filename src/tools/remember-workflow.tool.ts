import { workflowMemory } from "../workflow/services/workflow.memory.service.js";
import { logger } from "../utils/logger.js";

export async function rememberWorkflow() {

    const workflow = workflowMemory.remember({

        id: crypto.randomUUID(),

        name: "Login Workflow",

        application: "Playwright",

        pages: [
            "Home",
            "Docs"
        ],

        actions: [
            "Open",
            "Click Get Started"
        ],

        locators: [
            `page.getByRole("link", { name: "Get started" })`
        ],

        createdAt: new Date()

    });

    logger.info(workflow, "Workflow remembered");

    return workflow;

}