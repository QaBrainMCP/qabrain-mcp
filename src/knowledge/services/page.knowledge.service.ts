import { browserManager } from "../../browser/browser.manager.js";
import { ApplicationScanner } from "../../inspect/scanner/application.scanner.js";
import { ComponentScanner } from "../../inspect/components/component.scanner.js";
import { PageKnowledge } from "../pages/page.knowledge.js";

export class PageKnowledgeService {

    private applicationScanner = new ApplicationScanner();

    private componentScanner = new ComponentScanner();

    private pages: PageKnowledge[] = [];

    async remember(): Promise<PageKnowledge> {

        const page = browserManager.getPage();

        const application = await this.applicationScanner.scan(page);

        const components = await this.componentScanner.scan(page);

        const knowledge: PageKnowledge = {

            id: crypto.randomUUID(),

            title: application.title,

            url: application.url,

            buttons: components.buttons,

            inputs: components.inputs,

            forms: application.forms,

            links: application.links,

            rememberedAt: new Date()

        };

        this.pages.push(knowledge);

        return knowledge;

    }

    getPages() {
        return this.pages;
    }
}