import { browserManager } from "../../browser/browser.manager.js";
import { ApplicationScanner } from "../../inspect/scanner/application.scanner.js";
import { ComponentScanner } from "../../inspect/components/component.scanner.js";
import { ApplicationSnapshot } from "../models/application.snapshot.js";

export class ApplicationLearningService {

    private appScanner = new ApplicationScanner();

    private componentScanner = new ComponentScanner();

    async learn(): Promise<ApplicationSnapshot> {

        const page = browserManager.getPage();

        const app = await this.appScanner.scan(page);

        const components = await this.componentScanner.scan(page);

        return {

            title: app.title,

            url: app.url,

            pages: [app.title],

            forms: app.forms,

            buttons: components.buttons.length,

            links: app.links,

            inputs: components.inputs,

            timestamp: new Date()

        };

    }

}