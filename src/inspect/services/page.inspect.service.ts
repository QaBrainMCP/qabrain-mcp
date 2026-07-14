import { browserManager } from "../../browser/browser.manager.js";
import { ApplicationScanner } from "../scanner/application.scanner.js";
import { ComponentScanner } from "../components/component.scanner.js";

export class PageInspectService {

    private applicationScanner = new ApplicationScanner();

    private componentScanner = new ComponentScanner();

    async inspect() {

        const page = browserManager.getPage();

        const application = await this.applicationScanner.scan(page);

        const components = await this.componentScanner.scan(page);

        return {

            application,

            components

        };

    }

}