import { logger as defaultLogger } from "../../utils/logger.js";
import { ComponentChange } from "../models/component-change.model.js";
import { LocatorChange } from "../models/locator-change.model.js";
import { SnapshotDifference } from "../models/snapshot-difference.model.js";
import { Snapshot } from "../models/snapshot.model.js";
import { SnapshotPage } from "../models/snapshot-page.model.js";

export type SnapshotImpactLevel = "LOW" | "MEDIUM" | "HIGH";

export interface SnapshotComparisonMetrics {
    pagesAdded: number;
    pagesRemoved: number;
    componentsAdded: number;
    componentsRemoved: number;
    componentsChanged: number;
    locatorChanges: number;
    navigationChanges: number;
    relationshipChanges: number;
}

export interface SnapshotPerformanceMetrics {
    comparisonDurationMs: number;
    pagesCompared: number;
    componentsCompared: number;
    locatorsCompared: number;
}

export interface SnapshotChangeStatistics {
    totalChanges: number;
    breakingChanges: number;
    nonBreakingChanges: number;
    cosmeticChanges: number;
}

export interface SnapshotRiskAnalysis {
    overallRiskScore: number;
    riskLevel: SnapshotImpactLevel;
    reasons: string[];
}

export interface SnapshotRecommendationPlan {
    pagesRequiringRegression: string[];
    componentsRequiringLocatorReview: string[];
    suggestedSmokeTests: string[];
    suggestedRegressionSuites: string[];
}

export interface PageSnapshotDifference extends SnapshotDifference {
    relationshipChanges: ComponentChange[];
}

export interface SnapshotComparisonResult {
    applicationName: string;
    comparedFrom: string;
    comparedTo: string;
    differences: PageSnapshotDifference[];
    addedPages: string[];
    removedPages: string[];
    modifiedPages: string[];
    metrics: SnapshotComparisonMetrics;
    performance: SnapshotPerformanceMetrics;
    statistics: SnapshotChangeStatistics;
    riskAnalysis: SnapshotRiskAnalysis;
    impact: SnapshotImpactLevel;
    recommendations: string[];
    recommendationPlan: SnapshotRecommendationPlan;
    summary: string;
}

interface SnapshotComparerLogger {
    info: (obj: Record<string, unknown>, msg?: string) => void;
}

interface LocatorDescriptor {
    componentName: string;
    value: string;
    isBest: boolean;
    confidence?: number;
    stability?: number;
    automationRisk?: string;
    selfHealingCandidate?: boolean;
}

export class SnapshotComparerService {
    constructor(private readonly log: SnapshotComparerLogger = defaultLogger) {}

    compare(snapshotA: Snapshot, snapshotB: Snapshot): SnapshotComparisonResult {
        const startedAt = Date.now();
        const pagesA = new Map(snapshotA.pages.map(page => [page.url, page]));
        const pagesB = new Map(snapshotB.pages.map(page => [page.url, page]));

        const addedPages = [...pagesB.keys()].filter(url => !pagesA.has(url));
        const removedPages = [...pagesA.keys()].filter(url => !pagesB.has(url));
        const sharedPages = [...pagesA.keys()].filter(url => pagesB.has(url));

        const differences: PageSnapshotDifference[] = [];

        for (const url of sharedPages) {
            const pageA = pagesA.get(url);
            const pageB = pagesB.get(url);
            if (!pageA || !pageB) {
                continue;
            }

            const diff = this.comparePage(pageA, pageB);
            if (this.hasPageDiff(diff)) {
                differences.push(diff);
            }
        }

        const modifiedPages = differences.map(item => item.pageUrl);

        for (const pageUrl of addedPages) {
            const page = pagesB.get(pageUrl);
            if (!page) continue;
            differences.push(this.addedPageDiff(page));
        }

        for (const pageUrl of removedPages) {
            const page = pagesA.get(pageUrl);
            if (!page) continue;
            differences.push(this.removedPageDiff(page));
        }

        const metrics = this.metrics(addedPages, removedPages, differences);
        const performance = this.performance(startedAt, snapshotA, snapshotB);
        const statistics = this.statistics(metrics, differences);
        const riskAnalysis = this.risk(metrics, differences, removedPages.length, statistics);
        const impact = riskAnalysis.riskLevel;
        const recommendationPlan = this.recommendationPlan(differences, impact);
        const recommendations = this.recommendations(impact);
        const summary = this.buildSummary(snapshotA, snapshotB, metrics, impact, recommendations);

        this.log.info(
            {
                applicationName: snapshotB.applicationName || snapshotA.applicationName,
                snapshotA: snapshotA.snapshotName,
                snapshotB: snapshotB.snapshotName,
                metrics,
                performance,
                statistics,
                riskAnalysis,
                impact
            },
            "Snapshots compared"
        );

        return {
            applicationName: snapshotB.applicationName || snapshotA.applicationName,
            comparedFrom: snapshotA.snapshotName,
            comparedTo: snapshotB.snapshotName,
            differences,
            addedPages,
            removedPages,
            modifiedPages,
            metrics,
            performance,
            statistics,
            riskAnalysis,
            impact,
            recommendations,
            recommendationPlan,
            summary
        };
    }

    exportJsonReport(result: SnapshotComparisonResult): string {
        return JSON.stringify(result, null, 2);
    }

    exportMarkdownReport(result: SnapshotComparisonResult): string {
        const lines = [
            `# Snapshot Comparison Report`,
            "",
            `Application: ${result.applicationName}`,
            "",
            "Compared:",
            `- ${result.comparedFrom}`,
            `- ${result.comparedTo}`,
            "",
            "## Summary",
            `- Pages Added: ${result.metrics.pagesAdded}`,
            `- Pages Removed: ${result.metrics.pagesRemoved}`,
            `- Components Added: ${result.metrics.componentsAdded}`,
            `- Components Removed: ${result.metrics.componentsRemoved}`,
            `- Locators Changed: ${result.metrics.locatorChanges}`,
            `- Impact: ${result.impact}`,
            "",
            "## Performance",
            `- Comparison Duration (ms): ${result.performance.comparisonDurationMs}`,
            `- Pages Compared: ${result.performance.pagesCompared}`,
            `- Components Compared: ${result.performance.componentsCompared}`,
            `- Locators Compared: ${result.performance.locatorsCompared}`,
            "",
            "## Change Statistics",
            `- Total Changes: ${result.statistics.totalChanges}`,
            `- Breaking Changes: ${result.statistics.breakingChanges}`,
            `- Non-breaking Changes: ${result.statistics.nonBreakingChanges}`,
            `- Cosmetic Changes: ${result.statistics.cosmeticChanges}`,
            "",
            "## Risk Analysis",
            `- Overall Risk Score: ${result.riskAnalysis.overallRiskScore}`,
            `- Risk Level: ${result.riskAnalysis.riskLevel}`,
            "Reasons:",
            ...result.riskAnalysis.reasons.map(reason => `- ${reason}`),
            "",
            "## Recommendations",
            "Pages Requiring Regression:",
            ...this.asBulletList(result.recommendationPlan.pagesRequiringRegression),
            "",
            "Components Requiring Locator Review:",
            ...this.asBulletList(result.recommendationPlan.componentsRequiringLocatorReview),
            "",
            "Suggested Smoke Tests:",
            ...this.asBulletList(result.recommendationPlan.suggestedSmokeTests),
            "",
            "Suggested Regression Suites:",
            ...this.asBulletList(result.recommendationPlan.suggestedRegressionSuites)
        ];

        return lines.join("\n");
    }

    private comparePage(pageA: SnapshotPage, pageB: SnapshotPage): PageSnapshotDifference {
        const componentDiff = this.componentDiff(pageA.components, pageB.components);
        const locatorChanges = this.locatorDiff(pageA.locators, pageB.locators);
        const navigationChanges = this.navigationDiff(pageA.navigationTargets, pageB.navigationTargets);
        const relationshipChanges = this.relationshipDiff(pageA.relationships, pageB.relationships);

        return {
            pageUrl: pageA.url,
            addedComponents: componentDiff.added,
            removedComponents: componentDiff.removed,
            changedComponents: componentDiff.changed,
            locatorChanges,
            navigationChanges,
            relationshipChanges
        };
    }

    private addedPageDiff(page: SnapshotPage): PageSnapshotDifference {
        const addedComponents = this.unique(page.components.map(item => this.componentName(item)));
        const locatorChanges: LocatorChange[] = page.locators.map(locator => ({
            componentName: this.parseLocator(locator).componentName,
            oldLocator: null,
            newLocator: this.parseLocator(locator).value,
            changeType: "added"
        }));
        const navigationChanges: ComponentChange[] = page.navigationTargets.map(route => ({
            componentName: route,
            oldValue: null,
            newValue: route,
            changeType: "added"
        }));
        const relationshipChanges: ComponentChange[] = page.relationships.map(relation => ({
            componentName: relation,
            oldValue: null,
            newValue: relation,
            changeType: "added"
        }));

        return {
            pageUrl: page.url,
            addedComponents,
            removedComponents: [],
            changedComponents: [],
            locatorChanges,
            navigationChanges,
            relationshipChanges
        };
    }

    private removedPageDiff(page: SnapshotPage): PageSnapshotDifference {
        const removedComponents = this.unique(page.components.map(item => this.componentName(item)));
        const locatorChanges: LocatorChange[] = page.locators.map(locator => ({
            componentName: this.parseLocator(locator).componentName,
            oldLocator: this.parseLocator(locator).value,
            newLocator: null,
            changeType: "removed"
        }));
        const navigationChanges: ComponentChange[] = page.navigationTargets.map(route => ({
            componentName: route,
            oldValue: route,
            newValue: null,
            changeType: "removed"
        }));
        const relationshipChanges: ComponentChange[] = page.relationships.map(relation => ({
            componentName: relation,
            oldValue: relation,
            newValue: null,
            changeType: "removed"
        }));

        return {
            pageUrl: page.url,
            addedComponents: [],
            removedComponents,
            changedComponents: [],
            locatorChanges,
            navigationChanges,
            relationshipChanges
        };
    }

    private hasPageDiff(diff: PageSnapshotDifference): boolean {
        return (
            diff.addedComponents.length > 0 ||
            diff.removedComponents.length > 0 ||
            diff.changedComponents.length > 0 ||
            diff.locatorChanges.length > 0 ||
            diff.navigationChanges.length > 0 ||
            diff.relationshipChanges.length > 0
        );
    }

    private componentDiff(componentsA: string[], componentsB: string[]): {
        added: string[];
        removed: string[];
        changed: ComponentChange[];
    } {
        const mapA = new Map(componentsA.map(raw => [this.componentIdentity(raw), raw]));
        const mapB = new Map(componentsB.map(raw => [this.componentIdentity(raw), raw]));

        const addedRaw = [...mapB.keys()].filter(key => !mapA.has(key)).map(key => mapB.get(key) || "").filter(Boolean);
        const removedRaw = [...mapA.keys()].filter(key => !mapB.has(key)).map(key => mapA.get(key) || "").filter(Boolean);

        const changed: ComponentChange[] = [];
        const added = new Set(addedRaw);
        const removed = new Set(removedRaw);

        // Rename detection: same component type and highly similar names.
        for (const oldRaw of [...removed]) {
            const oldType = this.componentType(oldRaw);
            const oldName = this.componentName(oldRaw);

            for (const newRaw of [...added]) {
                if (oldType !== this.componentType(newRaw)) continue;
                const newName = this.componentName(newRaw);
                if (this.similarity(oldName, newName) < 0.72) continue;

                changed.push({
                    componentName: oldName,
                    changeType: "updated",
                    oldValue: oldRaw,
                    newValue: newRaw
                });

                removed.delete(oldRaw);
                added.delete(newRaw);
                break;
            }
        }

        // Metadata changes for same identity.
        for (const [identity, oldRaw] of mapA.entries()) {
            const newRaw = mapB.get(identity);
            if (!newRaw || newRaw === oldRaw) continue;

            changed.push({
                componentName: this.componentName(oldRaw),
                changeType: "updated",
                oldValue: oldRaw,
                newValue: newRaw
            });
        }

        return {
            added: this.unique([...added].map(item => this.componentName(item))),
            removed: this.unique([...removed].map(item => this.componentName(item))),
            changed
        };
    }

    private locatorDiff(locatorsA: string[], locatorsB: string[]): LocatorChange[] {
        const parsedA = locatorsA.map(item => this.parseLocator(item));
        const parsedB = locatorsB.map(item => this.parseLocator(item));

        const bestA = this.bestLocatorByComponent(parsedA);
        const bestB = this.bestLocatorByComponent(parsedB);

        const changes: LocatorChange[] = [];

        const allComponents = new Set<string>([
            ...bestA.keys(),
            ...bestB.keys()
        ]);

        for (const componentName of allComponents) {
            const oldLocator = bestA.get(componentName);
            const newLocator = bestB.get(componentName);

            if (!oldLocator && newLocator) {
                changes.push({
                    componentName,
                    oldLocator: null,
                    newLocator: newLocator.value,
                    changeType: "added"
                });
                continue;
            }

            if (oldLocator && !newLocator) {
                changes.push({
                    componentName,
                    oldLocator: oldLocator.value,
                    newLocator: null,
                    changeType: "removed"
                });
                continue;
            }

            if (!oldLocator || !newLocator) continue;

            if (oldLocator.value !== newLocator.value) {
                changes.push({
                    componentName,
                    oldLocator: oldLocator.value,
                    newLocator: newLocator.value,
                    changeType: "updated"
                });
                continue;
            }

            // Metrics-only changes (confidence/stability/risk/self-healing).
            const metricChanged =
                oldLocator.confidence !== newLocator.confidence ||
                oldLocator.stability !== newLocator.stability ||
                oldLocator.automationRisk !== newLocator.automationRisk ||
                oldLocator.selfHealingCandidate !== newLocator.selfHealingCandidate;

            if (metricChanged) {
                changes.push({
                    componentName,
                    oldLocator: oldLocator.value,
                    newLocator: newLocator.value,
                    changeType: "updated"
                });
            }
        }

        return changes;
    }

    private navigationDiff(routesA: string[], routesB: string[]): ComponentChange[] {
        const setA = new Set(routesA);
        const setB = new Set(routesB);
        const changes: ComponentChange[] = [];

        for (const route of setB) {
            if (!setA.has(route)) {
                changes.push({
                    componentName: route,
                    oldValue: null,
                    newValue: route,
                    changeType: "added"
                });
            }
        }

        for (const route of setA) {
            if (!setB.has(route)) {
                changes.push({
                    componentName: route,
                    oldValue: route,
                    newValue: null,
                    changeType: "removed"
                });
            }
        }

        return changes;
    }

    private relationshipDiff(relA: string[], relB: string[]): ComponentChange[] {
        const setA = new Set(relA);
        const setB = new Set(relB);
        const changes: ComponentChange[] = [];

        for (const relation of setB) {
            if (!setA.has(relation)) {
                changes.push({
                    componentName: relation,
                    oldValue: null,
                    newValue: relation,
                    changeType: "added"
                });
            }
        }

        for (const relation of setA) {
            if (!setB.has(relation)) {
                changes.push({
                    componentName: relation,
                    oldValue: relation,
                    newValue: null,
                    changeType: "removed"
                });
            }
        }

        return changes;
    }

    private metrics(
        addedPages: string[],
        removedPages: string[],
        diffs: PageSnapshotDifference[]
    ): SnapshotComparisonMetrics {
        return {
            pagesAdded: addedPages.length,
            pagesRemoved: removedPages.length,
            componentsAdded: diffs.reduce((sum, item) => sum + item.addedComponents.length, 0),
            componentsRemoved: diffs.reduce((sum, item) => sum + item.removedComponents.length, 0),
            componentsChanged: diffs.reduce((sum, item) => sum + item.changedComponents.length, 0),
            locatorChanges: diffs.reduce((sum, item) => sum + item.locatorChanges.length, 0),
            navigationChanges: diffs.reduce((sum, item) => sum + item.navigationChanges.length, 0),
            relationshipChanges: diffs.reduce((sum, item) => sum + item.relationshipChanges.length, 0)
        };
    }

    private performance(
        startedAt: number,
        snapshotA: Snapshot,
        snapshotB: Snapshot
    ): SnapshotPerformanceMetrics {
        const pagesCompared = new Set<string>([
            ...snapshotA.pages.map(page => page.url),
            ...snapshotB.pages.map(page => page.url)
        ]).size;

        return {
            comparisonDurationMs: Math.max(0, Date.now() - startedAt),
            pagesCompared,
            componentsCompared:
                this.countComponents(snapshotA.pages) + this.countComponents(snapshotB.pages),
            locatorsCompared:
                this.countLocators(snapshotA.pages) + this.countLocators(snapshotB.pages)
        };
    }

    private statistics(
        metrics: SnapshotComparisonMetrics,
        diffs: PageSnapshotDifference[]
    ): SnapshotChangeStatistics {
        const totalChanges =
            metrics.pagesAdded +
            metrics.pagesRemoved +
            metrics.componentsAdded +
            metrics.componentsRemoved +
            metrics.componentsChanged +
            metrics.locatorChanges +
            metrics.navigationChanges +
            metrics.relationshipChanges;

        const locatorBreaking = diffs
            .flatMap(item => item.locatorChanges)
            .filter(change => change.changeType === "removed").length;

        const relationshipBreaking = diffs
            .flatMap(item => item.relationshipChanges)
            .filter(change => /form|table/i.test(change.componentName)).length;

        const cosmeticComponentChanges = diffs
            .flatMap(item => item.changedComponents)
            .filter(change => this.componentIdentity(change.oldValue ?? "") === this.componentIdentity(change.newValue ?? ""))
            .length;

        const cosmeticLocatorChanges = diffs
            .flatMap(item => item.locatorChanges)
            .filter(change => change.oldLocator === change.newLocator)
            .length;

        const cosmeticChanges = cosmeticComponentChanges + cosmeticLocatorChanges;

        const breakingChanges =
            metrics.pagesRemoved +
            metrics.navigationChanges +
            metrics.componentsRemoved +
            locatorBreaking +
            relationshipBreaking;

        const nonBreakingChanges = Math.max(0, totalChanges - breakingChanges - cosmeticChanges);

        return {
            totalChanges,
            breakingChanges,
            nonBreakingChanges,
            cosmeticChanges
        };
    }

    private risk(
        metrics: SnapshotComparisonMetrics,
        diffs: PageSnapshotDifference[],
        pagesRemoved: number,
        statistics: SnapshotChangeStatistics
    ): SnapshotRiskAnalysis {
        const reasons: string[] = [];
        let score = 0;

        const locatorFailures = diffs
            .flatMap(item => item.locatorChanges)
            .filter(change => change.changeType === "removed").length;

        const formOrTableRelationshipChange = diffs
            .flatMap(item => item.relationshipChanges)
            .filter(change => /form|table/i.test(change.componentName)).length;

        if (pagesRemoved > 0) {
            score += Math.min(40, pagesRemoved * 20);
            reasons.push("One or more pages were removed.");
        }

        if (metrics.navigationChanges > 0) {
            score += Math.min(25, metrics.navigationChanges * 5);
            reasons.push("Navigation routes changed.");
        }

        if (locatorFailures > 0) {
            score += Math.min(20, locatorFailures * 10);
            reasons.push("Removed locators may break automation.");
        }

        if (formOrTableRelationshipChange > 0) {
            score += Math.min(20, formOrTableRelationshipChange * 10);
            reasons.push("Form or table relationships changed.");
        }

        if (statistics.breakingChanges > 0 && reasons.length === 0) {
            score += Math.min(20, statistics.breakingChanges * 3);
            reasons.push("Breaking structural changes detected.");
        }

        if (statistics.nonBreakingChanges > 0 && reasons.length === 0) {
            score += Math.min(15, statistics.nonBreakingChanges * 2);
            reasons.push("Non-breaking UI changes detected.");
        }

        if (score === 0) {
            reasons.push("Only cosmetic or metadata changes detected.");
        }

        const overallRiskScore = this.clamp(score, 0, 100);
        const riskLevel = overallRiskScore >= 67
            ? "HIGH"
            : overallRiskScore >= 34
                ? "MEDIUM"
                : "LOW";

        return {
            overallRiskScore,
            riskLevel,
            reasons: this.unique(reasons)
        };
    }

    private impact(
        metrics: SnapshotComparisonMetrics,
        diffs: PageSnapshotDifference[],
        pagesRemoved: number
    ): SnapshotImpactLevel {
        const locatorFailures = diffs
            .flatMap(item => item.locatorChanges)
            .filter(change => change.changeType === "removed").length;

        const formOrTableRelationshipChange = diffs
            .flatMap(item => item.relationshipChanges)
            .some(change => /form|table/i.test(change.componentName));

        if (
            pagesRemoved > 0 ||
            metrics.navigationChanges > 0 ||
            locatorFailures > 1 ||
            formOrTableRelationshipChange
        ) {
            return "HIGH";
        }

        if (
            metrics.componentsAdded > 0 ||
            metrics.componentsRemoved > 0 ||
            metrics.locatorChanges > 0
        ) {
            return "MEDIUM";
        }

        return "LOW";
    }

    private recommendations(impact: SnapshotImpactLevel): string[] {
        if (impact === "LOW") {
            return [
                "Review metadata changes.",
                "Run lightweight regression on affected components.",
                "Keep baseline snapshot updated."
            ];
        }

        if (impact === "MEDIUM") {
            return [
                "Review affected automation.",
                "Validate changed pages.",
                "Update impacted locators."
            ];
        }

        return [
            "Run full regression on impacted modules.",
            "Validate navigation and critical user journeys.",
            "Rebaseline locators and relationship mappings before release."
        ];
    }

    private recommendationPlan(
        diffs: PageSnapshotDifference[],
        impact: SnapshotImpactLevel
    ): SnapshotRecommendationPlan {
        const pagesRequiringRegression = this.unique(
            diffs
                .filter(diff => this.hasPageDiff(diff))
                .map(diff => diff.pageUrl)
        );

        const componentsRequiringLocatorReview = this.unique(
            diffs
                .flatMap(diff => diff.locatorChanges)
                .map(change => change.componentName)
                .filter(name => name && name !== "unknown")
        );

        const suggestedSmokeTests = [
            "Login and dashboard load validation",
            "Primary navigation route sanity check",
            "Critical form submit/cancel sanity"
        ];

        const suggestedRegressionSuites = impact === "HIGH"
            ? [
                "Full navigation regression suite",
                "End-to-end form workflows",
                "Locator resilience suite"
            ]
            : impact === "MEDIUM"
                ? [
                    "Changed-page regression suite",
                    "Locator update validation suite"
                ]
                : [
                    "Metadata-only smoke regression"
                ];

        return {
            pagesRequiringRegression,
            componentsRequiringLocatorReview,
            suggestedSmokeTests,
            suggestedRegressionSuites
        };
    }

    private buildSummary(
        snapshotA: Snapshot,
        snapshotB: Snapshot,
        metrics: SnapshotComparisonMetrics,
        impact: SnapshotImpactLevel,
        recommendations: string[]
    ): string {
        const lines = [
            `Application: ${snapshotB.applicationName || snapshotA.applicationName}`,
            "",
            "Compared:",
            `${snapshotA.snapshotName}`,
            `${snapshotB.snapshotName}`,
            "",
            "Summary:",
            `Pages Added: ${metrics.pagesAdded}`,
            `Pages Removed: ${metrics.pagesRemoved}`,
            `Components Added: ${metrics.componentsAdded}`,
            `Components Removed: ${metrics.componentsRemoved}`,
            `Locators Changed: ${metrics.locatorChanges}`,
            "",
            `Impact: ${impact}`,
            "",
            "Recommendations:"
        ];

        for (const recommendation of recommendations) {
            lines.push(`- ${recommendation}`);
        }

        return lines.join("\n");
    }

    private componentIdentity(raw: string): string {
        try {
            const parsed = JSON.parse(raw) as Record<string, unknown>;
            if (typeof parsed === "object" && parsed) {
                const type = typeof parsed.type === "string" ? parsed.type : "component";
                const name = typeof parsed.name === "string" ? parsed.name : raw;
                return `${type}:${name}`;
            }
        } catch {
            // Non-JSON component format.
        }

        const [head] = raw.split("|");
        if (!head) return raw;
        return head.trim();
    }

    private componentName(raw: string): string {
        try {
            const parsed = JSON.parse(raw) as Record<string, unknown>;
            if (typeof parsed?.name === "string") return parsed.name;
        } catch {
            // Non-JSON component format.
        }

        const base = this.componentIdentity(raw);
        const index = base.indexOf(":");
        if (index === -1) return base;
        return base.slice(index + 1);
    }

    private componentType(raw: string): string {
        try {
            const parsed = JSON.parse(raw) as Record<string, unknown>;
            if (typeof parsed?.type === "string") return parsed.type;
        } catch {
            // Non-JSON component format.
        }

        const base = this.componentIdentity(raw);
        const index = base.indexOf(":");
        if (index === -1) return "component";
        return base.slice(0, index);
    }

    private parseLocator(raw: string): LocatorDescriptor {
        try {
            const parsed = JSON.parse(raw) as Record<string, unknown>;
            if (typeof parsed === "object" && parsed) {
                const value = this.stringValue(parsed.value) ?? this.stringValue(parsed.locator) ?? raw;
                const componentName =
                    this.stringValue(parsed.componentName) ??
                    this.stringValue(parsed.component) ??
                    this.stringValue(parsed.name) ??
                    "unknown";

                return {
                    componentName,
                    value,
                    isBest: this.booleanValue(parsed.isBest) ?? this.booleanValue(parsed.best) ?? false,
                    confidence: this.numberValue(parsed.confidence),
                    stability: this.numberValue(parsed.stability),
                    automationRisk: this.stringValue(parsed.automationRisk),
                    selfHealingCandidate: this.booleanValue(parsed.selfHealingCandidate)
                };
            }
        } catch {
            // Non-JSON locator format.
        }

        return {
            componentName: "unknown",
            value: raw,
            isBest: false
        };
    }

    private bestLocatorByComponent(locators: LocatorDescriptor[]): Map<string, LocatorDescriptor> {
        const byComponent = new Map<string, LocatorDescriptor>();

        for (const locator of locators) {
            const current = byComponent.get(locator.componentName);
            if (!current) {
                byComponent.set(locator.componentName, locator);
                continue;
            }

            if (!current.isBest && locator.isBest) {
                byComponent.set(locator.componentName, locator);
                continue;
            }

            if (current.isBest === locator.isBest) {
                const currentConfidence = current.confidence ?? -1;
                const nextConfidence = locator.confidence ?? -1;
                if (nextConfidence > currentConfidence) {
                    byComponent.set(locator.componentName, locator);
                }
            }
        }

        return byComponent;
    }

    private similarity(a: string, b: string): number {
        const left = a.toLowerCase().trim();
        const right = b.toLowerCase().trim();
        if (!left || !right) return 0;
        if (left === right) return 1;

        const bigrams = (value: string): string[] => {
            if (value.length < 2) return [value];
            const pairs: string[] = [];
            for (let i = 0; i < value.length - 1; i++) {
                pairs.push(value.slice(i, i + 2));
            }
            return pairs;
        };

        const aPairs = bigrams(left);
        const bPairs = bigrams(right);
        const bCount = new Map<string, number>();
        for (const pair of bPairs) {
            bCount.set(pair, (bCount.get(pair) ?? 0) + 1);
        }

        let overlap = 0;
        for (const pair of aPairs) {
            const count = bCount.get(pair) ?? 0;
            if (count > 0) {
                overlap += 1;
                bCount.set(pair, count - 1);
            }
        }

        return (2 * overlap) / (aPairs.length + bPairs.length);
    }

    private unique(values: readonly string[]): string[] {
        return [...new Set(values)];
    }

    private countComponents(pages: SnapshotPage[]): number {
        return pages.reduce((sum, page) => sum + page.components.length, 0);
    }

    private countLocators(pages: SnapshotPage[]): number {
        return pages.reduce((sum, page) => sum + page.locators.length, 0);
    }

    private clamp(value: number, min: number, max: number): number {
        return Math.max(min, Math.min(max, value));
    }

    private asBulletList(items: string[]): string[] {
        if (items.length === 0) {
            return ["- None"];
        }

        return items.map(item => `- ${item}`);
    }

    private stringValue(value: unknown): string | undefined {
        return typeof value === "string" ? value : undefined;
    }

    private numberValue(value: unknown): number | undefined {
        return typeof value === "number" ? value : undefined;
    }

    private booleanValue(value: unknown): boolean | undefined {
        return typeof value === "boolean" ? value : undefined;
    }
}

export const snapshotComparerService = new SnapshotComparerService();
