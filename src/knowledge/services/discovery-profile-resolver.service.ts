import { DiscoveryProfile } from "../models/discovery-profile.model.js";

export class DiscoveryProfileResolver {
    resolve(actionType: string | undefined): DiscoveryProfile {
        const t = (actionType || "").toUpperCase();
        switch (t) {
            case "CLICK":
                return { name: "CLICK", include: ["buttons", "links", "menuItems"] };
            case "INPUT":
                return { name: "INPUT", include: ["textboxes", "dropdowns", "textareas", "inputs"] };
            case "VERIFY":
                return { name: "VERIFY", include: ["headings", "labels", "breadcrumbs", "titles", "tabs", "tableHeaders"] };
            case "NAVIGATE":
                return { name: "NAVIGATION", include: ["sidebar", "menu", "navbar", "breadcrumbs"] };
            case "SEARCH":
                return { name: "SEARCH", include: ["inputs", "tables", "buttons"] };
            default:
                return { name: "DEFAULT", include: ["buttons", "links", "inputs", "forms", "tables"] };
        }
    }
}

export const discoveryProfileResolver = new DiscoveryProfileResolver();
