import { ApplicationMemory } from "../application/application.model.js";
import { ApplicationScanResult } from "../../inspect/scanner/application.scanner.js";

export class ApplicationMemoryBuilder {

    build(
        name: string,
        scan: ApplicationScanResult
    ): ApplicationMemory {

        return {

            id: crypto.randomUUID(),

            name,

            baseUrl: scan.url,

            pages: [scan.title],

            workflows: [],

            testCases: [],

            locators: [],

            createdAt: new Date(),

            updatedAt: new Date()

        };

    }

}