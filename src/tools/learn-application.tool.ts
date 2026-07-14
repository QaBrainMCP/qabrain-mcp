
import { openUrl } from "./open-url.tool.js";
// New
import { ApplicationLearningService } from "../knowledge/services/application.learning.service.js";
const learner = new ApplicationLearningService();

export async function learnApplication() {

    await openUrl("https://playwright.dev");

    const snapshot = await learner.learn();

    console.log("========== APPLICATION SNAPSHOT ==========");

    console.table(snapshot);

}