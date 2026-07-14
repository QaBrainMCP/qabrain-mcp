import { browserManager } from "../../browser/browser.manager.js";
import { ApplicationScanner } from "../../inspect/scanner/application.scanner.js";
import { ApplicationMemoryBuilder } from "../builder/application.memory.builder.js";
import { memoryStore } from "../repository/memory.store.js";

export class ApplicationMemoryService {

    private scanner = new ApplicationScanner();

    private builder = new ApplicationMemoryBuilder();

    async remember(name: string) {

        const page = browserManager.getPage();

        const scan = await this.scanner.scan(page);

        const memory = this.builder.build(name, scan);

        memoryStore.saveApplication(memory);

        return memory;
    }

}