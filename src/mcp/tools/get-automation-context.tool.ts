import type { MCPTool } from "../registry/tool.registry.js";
import { knowledgeStoreService } from "../../knowledge/store/knowledge-store.service.js";
import { pageSearchService } from "../../services/repository/page-search.service.js";
import { snapshotService } from "../../snapshot/services/snapshot.service.js";
import { logger } from "../../utils/logger.js";
import type { AutomationContext } from "../models/automation-context.js";
import type ComponentContext from "../models/component-context.js";

export interface AutomationContextRequest {
    pageName: string;
    includeNavigation?: boolean;
    includeVerification?: boolean;
    includeHistory?: boolean;
}

function generateAutomationName(businessName: string | undefined, componentType?: string, componentId?: string) {
    if (!businessName || !businessName.trim()) {
        return `${componentType ?? 'component'}_${componentId ?? Math.random().toString(36).slice(2,8)}`;
    }

    const cleaned = businessName.replace(/[^a-zA-Z0-9 ]+/g, ' ').trim();
    const words = cleaned.split(/\s+/).filter(Boolean);
    const base = words.map((w, i) => i === 0 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1).toLowerCase()).join('');

    const nameLower = businessName.toLowerCase();
    const typeLower = (componentType ?? '').toLowerCase();

    let suffix = 'Element';
    if (typeLower.includes('input') || typeLower.includes('field') || /name|email|password|search|username|phone|employee/i.test(nameLower)) suffix = 'Input';
    else if (typeLower.includes('button') || /login|submit|save|add|search/i.test(nameLower)) suffix = 'Button';
    else if (typeLower.includes('link') || typeLower.includes('nav')) suffix = 'Link';
    else if (typeLower.includes('table')) suffix = 'Table';

    return `${base}${suffix}`;
}

function toLocatorSummary(locator: any) {
    return {
        locatorId: locator.locatorId,
        strategy: locator.strategy,
        locator: locator.locator,
        confidence: locator.confidence,
        lastValidated: locator.lastValidated,
        isPrimary: locator.isPrimary ?? false
    };
}

export const GetAutomationContextTool: MCPTool<AutomationContextRequest> = {
    name: "get_automation_context",
    description: "Return automation-focused knowledge for a page (read-only)",
    async execute(input: AutomationContextRequest) {
        const start = Date.now();
        logger.info({ page: input.pageName }, "Automation Context Requested");

        try {
            await knowledgeStoreService.load();

            // find page using intelligent repository lookup
            const match = pageSearchService.findBestMatch(input.pageName);

            if (!match.found || !match.page) {
                logger.info({ query: input.pageName }, "Repository Lookup: not learned");

                const allPages = Object.values((knowledgeStoreService as any).pages ?? {}).map((p: any) => p.pageName).filter(Boolean).sort((a: string,b: string)=>a.localeCompare(b));

                return {
                    status: "page_not_learned",
                    message: `Page '${input.pageName}' has not been learned.`,
                    suggestion: {
                        action: "learn_feature",
                        reason: "No repository match found."
                    },
                    availablePages: allPages
                } as any;
            }

            const page = match.page;
            logger.info({ pageId: page.pageId, pageName: page.pageName, matchType: match.matchType, confidence: match.confidence }, "Repository Lookup: found");

            // components
            const componentIds: string[] = page.components ?? [];
            const components: ComponentContext[] = [];
            for (const cid of componentIds) {
                const comp = knowledgeStoreService.getComponent(cid as string);
                if (!comp) continue;

                const locators = knowledgeStoreService.getLocatorsForComponent(comp.componentId) ?? [];
                // pick primary
                let primary = locators.find(l => l.isPrimary) ?? locators.sort((a,b) => (b.confidence ?? 0) - (a.confidence ?? 0))[0];
                const alternatives = locators.filter(l => !primary || l.locatorId !== primary.locatorId).map(toLocatorSummary);

                const automationName = comp.automationName ?? generateAutomationName(comp.businessName, comp.componentType, comp.componentId);

                const componentContext: ComponentContext = {
                    componentId: comp.componentId,
                    businessName: comp.businessName,
                    automationName,
                    componentType: comp.componentType,
                    role: comp.state ?? undefined,
                    required: false,
                    primaryLocator: primary ? toLocatorSummary(primary) : null,
                    alternativeLocators: alternatives,
                    confidence: comp.confidence,
                    lastValidated: comp.lastValidated,
                    visibility: undefined,
                    dependencies: []
                } as any;

                components.push(componentContext);
            }

            // verification
            let verification: any = {};
            if (input.includeVerification) {
                const pageComps = components;
                const heading = pageComps.find(c => (c.componentType ?? '').toLowerCase().includes('heading') || /title|heading/i.test(c.businessName ?? ''));
                const breadcrumb = pageComps.find(c => (c.componentType ?? '').toLowerCase().includes('breadcrumb'));
                const table = pageComps.find(c => (c.componentType ?? '').toLowerCase().includes('table'));
                const labels = pageComps.filter(c => (c.componentType ?? '').toLowerCase().includes('label')).map(c => c.businessName ?? c.automationName);
                const toast = pageComps.find(c => (c.componentType ?? '').toLowerCase().includes('toast') || (c.businessName ?? '').toLowerCase().includes('toast'));

                verification = {
                    expectedHeading: heading?.businessName ?? null,
                    expectedUrl: page.urlPattern ?? null,
                    expectedBreadcrumb: breadcrumb?.businessName ?? null,
                    expectedTable: table?.businessName ?? null,
                    expectedLabels: labels,
                    expectedToast: toast?.businessName ?? null
                };
            }

            // navigation
            let navigation: any = undefined;
            if (input.includeNavigation) {
                const allNav = knowledgeStoreService.getNavigation();
                const prev = allNav.filter(n => n.toPage === page.pageId).map(n => n.fromPage);
                const next = allNav.filter(n => n.fromPage === page.pageId).map(n => n.toPage);
                const navComponents = allNav.filter(n => n.fromPage === page.pageId || n.toPage === page.pageId).map(n => n.component).filter(Boolean) as string[];
                const menuPath = allNav.filter(n => n.action === 'menu' && n.toPage === page.pageId).map(n => String(n.component ?? ''));

                navigation = {
                    previousPages: prev,
                    nextPages: next,
                    navigationComponents: navComponents,
                    menuPath
                };
            }

            // dependencies
            const loginRequired = !!components.find(c => (c.componentType ?? '').toLowerCase().includes('login') || /(login|username|password)/i.test(c.businessName ?? ''));

            // metadata
            const metaAny = (knowledgeStoreService as any).metadata ?? {};
            const repoVersion = metaAny.version ?? null;
            const lastLearned = metaAny.lastOpenedAt ?? null;

            const latestSnapshot = snapshotService.getLatestSnapshot(page.application ?? 'application');

            const automationContext: AutomationContext = {
                application: page.application,
                page: {
                    pageName: page.pageName,
                    urlPattern: page.urlPattern,
                    title: page.title,
                    description: page.description,
                    pageType: (page.pageName ?? '').toLowerCase().includes('login') ? 'login' : undefined
                },
                navigation,
                components,
                verification: input.includeVerification ? verification : undefined,
                dependencies: {
                    loginRequired,
                    roleRequired: null,
                    modalRequired: false,
                    preconditions: []
                },
                metadata: {
                    confidence: components.length > 0 ? (components.map(c => c.confidence ?? 0).reduce((a,b)=>a+b,0) / components.length) : undefined,
                    snapshotVersion: latestSnapshot?.version ?? null,
                    repositoryVersion: repoVersion,
                    lastLearned
                }
            } as AutomationContext;

            logger.info({ page: page.pageName, components: components.length, durationMs: Date.now() - start }, "Automation Context Prepared");

            return automationContext;
        } catch (err) {
            logger.error({ err }, "get_automation_context failed");
            return { status: 'error', message: String(err) } as any;
        }
    }
};
