import { LocatorCandidate } from "../models/candidate-locator.model.js";

const PRIORITY: LocatorCandidate["strategy"][] = [
    "data-testid",
    "data-test",
    "data-qa",
    "id",
    "aria-label",
    "label-association",
    "name",
    "placeholder",
    "role",
    "visible-text",
    "css",
    "xpath",
    "title",
    "alt",
    "href"
];

export class LocatorSelectorService {
    select(candidates: LocatorCandidate[]): LocatorCandidate {
        if (candidates.length === 0) {
            throw new Error("No locator candidates to select from");
        }

        return [...candidates].sort((a, b) => {
            const pa = PRIORITY.indexOf(a.strategy);
            const pb = PRIORITY.indexOf(b.strategy);
            if (pa !== pb) return pa - pb;
            if (b.confidence !== a.confidence) return b.confidence - a.confidence;
            if (b.uniqueness !== a.uniqueness) return b.uniqueness - a.uniqueness;
            return b.stability - a.stability;
        })[0];
    }
}
