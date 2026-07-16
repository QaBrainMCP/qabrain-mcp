import { ApplicationAdapter } from "./application.adapter.js";
import { orangeHRMAdapter } from "../orangehrm/orangehrm.adapter.js";

export class AdapterRegistry {

    private readonly adapters = new Map<string, ApplicationAdapter>();

    constructor() {
        this.register(orangeHRMAdapter);
    }

    register(adapter: ApplicationAdapter): void {
        this.adapters.set(adapter.name.toLowerCase(), adapter);
    }

    get(application: string): ApplicationAdapter {

        const adapter = this.adapters.get(application.toLowerCase());

        if (!adapter) {
            throw new Error(
                `No Application Adapter registered for '${application}'.`
            );
        }

        return adapter;
    }

    getAll(): ApplicationAdapter[] {
        return [...this.adapters.values()];
    }
}

export const adapterRegistry = new AdapterRegistry();