import { knowledgeStoreService } from "../../../knowledge/store/knowledge-store.service.js";

export interface KnowledgeAnalysis {
    pages: number;
    components: number;
    locators: number;
    navigation: number;
    missingComponents: string[]; // pageIds
    missingLocators: string[]; // componentIds
    missingVerification: string[]; // componentIds
    complete: boolean;
}

export async function analyzeKnowledge(): Promise<KnowledgeAnalysis> {
    await knowledgeStoreService.load();

    const pages = Object.values((knowledgeStoreService as any).pages ?? {});
    const componentsMap = (knowledgeStoreService as any).components ?? {};
    const locatorsMap = (knowledgeStoreService as any).locators ?? {};
    const navigation = (knowledgeStoreService as any).navigation ?? [];

    const missingComponents: string[] = [];
    const missingLocators: string[] = [];
    const missingVerification: string[] = [];

    for (const p of pages) {
        const comps: string[] = p.components ?? [];
        if (!comps || comps.length === 0) {
            missingComponents.push(p.pageId);
        }
        for (const cid of comps) {
            const c = componentsMap[cid];
            const locs = Object.values(locatorsMap).filter((l: any) => l.componentId === cid);
            if (!locs || locs.length === 0) missingLocators.push(cid);
            if (!c || !c.lastValidated) missingVerification.push(cid);
        }
    }

    const analysis = {
        pages: pages.length,
        components: Object.keys(componentsMap).length,
        locators: Object.keys(locatorsMap).length,
        navigation: navigation.length,
        missingComponents,
        missingLocators,
        missingVerification,
        complete: missingComponents.length === 0 && missingLocators.length === 0 && missingVerification.length === 0
    } as KnowledgeAnalysis;

    return analysis;
}
