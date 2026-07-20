import { LocatorCandidate } from "../models/candidate-locator.model.js";

const STABILITY: Record<LocatorCandidate["strategy"], number> = {
    "data-testid": 100,
    "data-test": 98,
    "data-qa": 96,
    id: 92,
    "aria-label": 88,
    "label-association": 84,
    name: 82,
    placeholder: 78,
    role: 72,
    "visible-text": 60,
    css: 48,
    xpath: 40,
    title: 66,
    alt: 66,
    href: 68
};

const FRAMEWORK_COMPATIBILITY: Record<LocatorCandidate["strategy"], number> = {
    "data-testid": 100,
    "data-test": 98,
    "data-qa": 98,
    id: 95,
    name: 92,
    "aria-label": 90,
    role: 84,
    placeholder: 82,
    "label-association": 84,
    title: 78,
    alt: 78,
    href: 75,
    "visible-text": 68,
    css: 65,
    xpath: 55
};

export class LocatorScorerService {
    score(candidate: LocatorCandidate, matchCount: number): LocatorCandidate {
        const uniqueness = this.uniqueness(matchCount);
        const stability = STABILITY[candidate.strategy] ?? 40;
        const readability = this.readability(candidate.value);
        const maintainability = Math.round((stability * 0.7) + (readability * 0.3));
        const frameworkCompatibilityScore = FRAMEWORK_COMPATIBILITY[candidate.strategy] ?? 55;

        const failureReasons = this.failureReasons(
            candidate.value,
            candidate.strategy,
            candidate.matchedCount,
            candidate.isValid
        );
        const recommendations = this.recommendations(candidate.strategy, failureReasons);
        const automationRisk = this.automationRisk(
            candidate.strategy,
            candidate.isValid,
            candidate.isUnique,
            failureReasons
        );
        const selfHealingCandidate = this.selfHealingCandidate(candidate, automationRisk);

        const penalty = Math.min(20, failureReasons.length * 4);
        const validityBonus = candidate.isValid ? 8 : -25;
        const uniquenessBonus = candidate.isUnique ? 6 : -6;
        const confidence = this.clamp(
            Math.round(
                (uniqueness * 0.4) +
                (stability * 0.3) +
                (readability * 0.1) +
                (maintainability * 0.1) +
                (frameworkCompatibilityScore * 0.1) -
                penalty +
                validityBonus +
                uniquenessBonus
            )
        );

        return {
            ...candidate,
            matchedCount: candidate.matchedCount,
            isUnique: candidate.isUnique,
            isValid: candidate.isValid,
            automationRisk,
            selfHealingCandidate,
            confidence,
            stability,
            uniqueness,
            readability,
            maintainability,
            readable: readability,
            scoreBreakdown: {
                uniquenessScore: uniqueness,
                stabilityScore: stability,
                readabilityScore: readability,
                maintainabilityScore: maintainability,
                frameworkCompatibilityScore
            },
            failureReasons,
            recommendations,
            explanation: this.explanation(candidate.strategy, candidate.value, confidence, {
                uniqueness,
                stability,
                readability,
                maintainability,
                frameworkCompatibilityScore
            }, failureReasons)
        };
    }

    private failureReasons(
        value: string,
        strategy: LocatorCandidate["strategy"],
        matchCount: number,
        isValid: boolean
    ): string[] {
        const reasons: string[] = [];

        if (!isValid) {
            reasons.push("invalid locator");
        }

        if (matchCount > 1) {
            reasons.push("duplicate id");
        }

        if (strategy === "xpath" && (value.startsWith("/") || value.includes("/html"))) {
            reasons.push("generated xpath");
        }

        if (/nth-of-type|nth-child/i.test(value)) {
            reasons.push("nth-child selector");
        }

        if (/class=|\.[a-z0-9_-]*\d{2,}|__[a-z0-9]+/i.test(value)) {
            reasons.push("dynamic class detected");
        }

        if (/react|__react|data-r[0-9a-z]+/i.test(value)) {
            reasons.push("dynamic React attribute");
        }

        if (/\bng-[a-z0-9-]+\b|\b_?ngcontent-[a-z0-9-]+\b|\b_?nghost-[a-z0-9-]+\b/i.test(value)) {
            reasons.push("dynamic Angular id");
        }

        if (/\b[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}\b/i.test(value)) {
            reasons.push("dynamic UUID detected");
        }

        if (/\b(1[6-9]\d{11}|2\d{12}|\d{10})\b/.test(value)) {
            reasons.push("timestamp-like value detected");
        }

        if (/\b[a-f0-9]{32,}\b|\b[A-Za-z0-9+/_-]{24,}={0,2}\b/.test(value)) {
            reasons.push("hashed value detected");
        }

        if (/\d{4,}|\b\d{2,}\b/.test(value) || /^\s*[A-Za-z]+\s*[0-9]{1,3}\s*$/.test(value)) {
            reasons.push("volatile text");
        }

        return [...new Set(reasons)];
    }

    private recommendations(
        strategy: LocatorCandidate["strategy"],
        failureReasons: readonly string[]
    ): string[] {
        const rec = new Set<string>();

        if (strategy !== "data-testid") {
            rec.add("Prefer data-testid");
        }

        if (strategy !== "aria-label") {
            rec.add("Prefer aria-label");
        }

        if (failureReasons.length > 0) {
            rec.add("Ask developers to add test id");
        }

        if (failureReasons.includes("generated xpath") || failureReasons.includes("nth-child selector")) {
            rec.add("Prefer stable attribute-based selector");
        }

        return [...rec];
    }

    private automationRisk(
        strategy: LocatorCandidate["strategy"],
        isValid: boolean,
        isUnique: boolean,
        failureReasons: readonly string[]
    ): "low" | "medium" | "high" {
        if (!isValid) {
            return "high";
        }

        const highSignals = [
            "generated xpath",
            "nth-child selector",
            "dynamic class detected",
            "dynamic React attribute",
            "dynamic Angular id",
            "dynamic UUID detected",
            "timestamp-like value detected",
            "hashed value detected"
        ];

        const highCount = failureReasons.filter(reason => highSignals.includes(reason)).length;

        if (strategy === "xpath" || highCount >= 2 || !isUnique) {
            return "high";
        }

        if (highCount === 1 || failureReasons.length > 0 || strategy === "css" || strategy === "visible-text") {
            return "medium";
        }

        return "low";
    }

    private selfHealingCandidate(
        candidate: LocatorCandidate,
        automationRisk: "low" | "medium" | "high"
    ): boolean {
        const semanticStrategies: LocatorCandidate["strategy"][] = [
            "data-testid",
            "data-test",
            "data-qa",
            "aria-label",
            "label-association",
            "name",
            "placeholder",
            "role"
        ];

        return (
            candidate.isValid &&
            semanticStrategies.includes(candidate.strategy) &&
            automationRisk !== "high"
        );
    }

    private explanation(
        strategy: LocatorCandidate["strategy"],
        value: string,
        confidence: number,
        scores: {
            uniqueness: number;
            stability: number;
            readability: number;
            maintainability: number;
            frameworkCompatibilityScore: number;
        },
        failureReasons: readonly string[]
    ): string {
        const lines = [
            "Best Locator",
            `Strategy: ${strategy}`,
            `Value: ${value}`,
            `Confidence: ${confidence}`,
            "",
            "Reason:",
            scores.uniqueness >= 90 ? "Unique across page." : "May match multiple elements.",
            scores.stability >= 80 ? "Stable attribute usage." : "Potentially volatile attribute usage.",
            scores.frameworkCompatibilityScore >= 80
                ? "Framework independent."
                : "May require framework-specific handling.",
            failureReasons.length === 0
                ? "No dynamic values detected."
                : `Detected risks: ${failureReasons.join(", ")}.`
        ];

        return lines.join("\n");
    }

    private uniqueness(matchCount: number): number {
        if (matchCount <= 0) return 0;
        if (matchCount === 1) return 100;
        return this.clamp(Math.round(100 / matchCount));
    }

    private readability(value: string): number {
        const lengthPenalty = Math.min(45, Math.max(0, value.length - 22));
        const symbolPenalty = (value.match(/[\[\]()>:@]/g) || []).length;
        return this.clamp(100 - lengthPenalty - symbolPenalty);
    }

    private clamp(value: number): number {
        return Math.max(0, Math.min(100, value));
    }
}
