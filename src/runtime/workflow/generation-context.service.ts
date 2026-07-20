import { automationSessionManager } from "../automation-session-manager.js";
import { logger } from "../../utils/logger.js";
import { pageSearchService } from "../../services/repository/page-search.service.js";
import type { GenerationContext } from "./generation-context.js";

function makeAutomationName(businessName: string | undefined, componentType?: string) {
    if (!businessName || !businessName.trim()) return `${(componentType ?? 'component')}`;
    const cleaned = businessName.replace(/[^a-zA-Z0-9 ]+/g, ' ').trim();
    const words = cleaned.split(/\s+/).filter(Boolean);
    const base = words.map((w, i) => i === 0 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1).toLowerCase()).join('');
    const typeLower = (componentType ?? '').toLowerCase();
    let suffix = 'Element';
    if (typeLower.includes('input') || typeLower.includes('field') || /name|email|password|search|username|phone|employee/i.test(businessName ?? '')) suffix = 'Input';
    else if (typeLower.includes('button') || /login|submit|save|add|search/i.test(businessName ?? '')) suffix = 'Button';
    else if (typeLower.includes('link') || typeLower.includes('nav')) suffix = 'Link';
    else if (typeLower.includes('table')) suffix = 'Table';
    return `${base}${suffix}`;
}

export class GenerationContextService {
    async prepare(sessionId: string, pageName: string): Promise<GenerationContext | { status: string; message?: string } | null> {
        const start = Date.now();
        logger.info({ sessionId, pageName }, "Workflow Started");

        const session = await automationSessionManager.getSessionContext(sessionId as any);
        if (!session) return { status: 'session_not_found', message: `Session ${sessionId} not found` };

        // find page in cachedPages using same normalize logic
        const pages: Record<string, any> = session.cachedPages ?? {};
        const pageEntries = Object.values(pages);

        const normQ = pageSearchService.normalize(pageName);

        let best: any = null;
        let bestScore = 0;

        for (const p of pageEntries) {
            const candidates = [p.pageName ?? '', p.title ?? '', p.urlPattern ?? ''];
            for (const candidate of candidates) {
                const norm = pageSearchService.normalize(candidate);
                if (!norm) continue;
                if (candidate === pageName) { best = p; bestScore = 100; break; }
                if (candidate.toLowerCase() === pageName.toLowerCase()) { if (99>bestScore){ best = p; bestScore=99;} }
                if (norm === normQ) { if (97>bestScore){ best = p; bestScore=97;} }
                if (norm.includes(normQ) || normQ.includes(norm)) { if (90>bestScore){ best = p; bestScore=90;} }
            }
            if (bestScore === 100) break;
        }

        if (!best) {
            logger.info({ sessionId, pageName }, "Workflow: page not found in session cache");
            return { status: 'page_not_in_session', message: `Page ${pageName} not found in session` };
        }

        // components
        const componentsMap: Record<string, any> = session.cachedComponents ?? {};
        const componentIds: string[] = best.components ?? [];
        const components = componentIds.map(cid => {
            const c = componentsMap[cid];
            const automationName = makeAutomationName(c?.businessName, c?.componentType);
            const locators = (c && (c.locators ?? [])) || [];
            return {
                componentId: c?.componentId,
                businessName: c?.businessName,
                automationName,
                componentType: c?.componentType,
                confidence: c?.confidence,
                lastValidated: c?.lastValidated,
                locators
            };
        }).filter(Boolean);

        // determine knowledge health
        const missingComponents = [] as string[];
        const missingLocators = [] as string[];
        for (const cid of componentIds) {
            const c = componentsMap[cid];
            if (!c) missingComponents.push(cid);
            else {
                const locs = c.locators ?? [];
                if (locs.length === 0) missingLocators.push(cid);
            }
        }

        let healthStatus: GenerationContext['knowledgeHealth'] = { status: 'Complete' };
        if (missingComponents.length > 0) healthStatus = { status: 'Missing Components', missingComponents };
        else if (missingLocators.length > 0) healthStatus = { status: 'Missing Locators', missingLocators };

        const metadata = session.cachedMetadata ?? {};

        const recommendedAutomationNames: Record<string,string> = {};
        for (const c of components) {
            if (c.businessName) recommendedAutomationNames[c.businessName] = c.automationName;
        }

        const gen: GenerationContext = {
            application: session.application,
            feature: session.feature,
            page: {
                pageName: best.pageName,
                urlPattern: best.urlPattern,
                title: best.title,
                description: best.description,
                pageType: (best.pageName ?? '').toLowerCase().includes('login') ? 'login' : undefined
            },
            components,
            navigation: session.cachedNavigation ? { previousPages: [], nextPages: [], navigationComponents: [], menuPath: [] } : undefined,
            verification: session.cachedVerification ? (session.cachedVerification as any)[best.pageId] ?? undefined : undefined,
            dependencies: {},
            knowledgeHealth: healthStatus,
            metadata: { repositoryVersion: session.cachedMetadata?.version ?? null, snapshotVersion: session.snapshotVersion ?? null },
            recommendedAutomationNames
        };

        logger.info({ sessionId, pageName, durationMs: Date.now() - start }, "Generation Context Built");

        return gen;
    }
}

export const generationContextService = new GenerationContextService();
