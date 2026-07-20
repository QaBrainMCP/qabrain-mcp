import { LocatorCandidate } from "./candidate-locator.model.js";

export interface LocatorResult {
    bestLocator: LocatorCandidate;
    candidates: LocatorCandidate[];
    fallbackLocators: LocatorCandidate[];
}
