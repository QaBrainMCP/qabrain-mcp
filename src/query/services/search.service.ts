import { applicationMapService } from "../../application/services/application-map.service.js";
import { coverageRepository } from "../../coverage/repository/coverage.repository.js";
import { impactRepository } from "../../impact/repository/impact.repository.js";
import { knowledgeRepository } from "../../knowledge/repository/knowledge.repository.js";
import { mappingRepository } from "../../mapping/repository/mapping.repository.js";
import { memoryStore } from "../../memory/repository/memory.store.js";
import { workflowMemory } from "../../workflow/services/workflow.memory.service.js";
import { Query } from "../models/query.model.js";
import { SearchMatch } from "../models/query-result.model.js";

export class SearchService {
    search(query: Query): SearchMatch[] {
        switch (query.intent) {
            case "PAGES_BY_COMPONENT":
            case "PAGES_BY_TERM":
                return this.pagesByTerm(query.subject);
            case "WORKFLOW":
                return this.workflowsByName(query.subject);
            case "UNCOVERED_REQUIREMENTS":
                return coverageRepository.getAll()
                    .filter(report => report.gaps.length > 0 || Object.values(report.coverage).some(score => score < 100))
                    .map(report => this.match(report.requirement, "coverage", 100));
            case "WORKFLOWS_BY_PAGE":
                return workflowMemory.getAll()
                    .filter(workflow => workflow.pages.some(page => this.matches(query.subject, page)))
                    .map(workflow => this.match(workflow.name, "workflow", 100));
            case "PAGES_WITH_FORMS":
                return knowledgeRepository.getPages()
                    .filter(page => page.forms.length > 0)
                    .map(page => this.match(page.title, "application-knowledge", 100));
            case "AFFECTED_REQUIREMENTS":
                return impactRepository.getAll()
                    .filter(report => this.matches(query.subject, report.changed))
                    .flatMap(report => report.affectedRequirements)
                    .map(requirement => this.match(requirement, "impact", 100));
            case "APPLICATION_KNOWLEDGE":
                return knowledgeRepository.getPages().map(page => this.match(page.title, "application-knowledge", 100));
            case "APPLICATIONS":
                return this.applications();
            case "LOCATORS_BY_PAGE":
                return this.locatorsByPage(query.subject);
            default:
                return [];
        }
    }

    private pagesByTerm(subject: string | null): SearchMatch[] {
        const knownPages = knowledgeRepository.getPages().filter(page =>
            this.matches(subject, page.title) || page.locators.some(locator => this.matches(subject, locator)) ||
            this.components(page).some(component => this.matches(subject, component.name))
        ).map(page => this.match(page.title, "application-knowledge", 100));
        const mappedPages = applicationMapService.getMap().pages
            .filter(page => this.matches(subject, page.title))
            .map(page => this.match(page.title, "application-map", 80));
        const requirementPages = mappingRepository.getAll()
            .flatMap(mapping => mapping.pages)
            .filter(page => this.matches(subject, page))
            .map(page => this.match(page, "requirement-mapping", 70));
        return [...knownPages, ...mappedPages, ...requirementPages];
    }

    private workflowsByName(subject: string | null): SearchMatch[] {
        return workflowMemory.getAll()
            .filter(workflow => this.matches(subject, workflow.name))
            .map(workflow => this.match(workflow.name, "workflow", 100));
    }

    private locatorsByPage(subject: string | null): SearchMatch[] {
        const pageLocators = knowledgeRepository.getPages()
            .filter(page => this.matches(subject, page.title))
            .flatMap(page => page.locators)
            .map(locator => this.match(locator, "locator-knowledge", 100));
        const workflowLocators = workflowMemory.getAll()
            .filter(workflow => workflow.pages.some(page => this.matches(subject, page)))
            .flatMap(workflow => workflow.locators)
            .map(locator => this.match(locator, "workflow", 80));
        const mappedLocators = mappingRepository.getAll()
            .flatMap(mapping => mapping.knownLocators)
            .map(locator => this.match(locator, "requirement-mapping", 70));
        return [...pageLocators, ...workflowLocators, ...mappedLocators];
    }

    private applications(): SearchMatch[] {
        const applicationMap = applicationMapService.getMap().applicationName;
        const names = [
            ...(applicationMap ? [applicationMap] : []),
            ...memoryStore.getApplications().map(application => application.name)
        ];
        return names.map(name => this.match(name, "application-memory", 100));
    }

    private components(page: ReturnType<typeof knowledgeRepository.getPages>[number]) {
        return [
            ...page.buttons, ...page.links, ...page.inputs, ...page.dropdowns,
            ...page.forms, ...page.tables, ...page.dialogs
        ];
    }

    private matches(subject: string | null, value: string): boolean {
        if (!subject) return false;
        const normalize = (item: string) => item.toLowerCase().replace(/\s+button$/, "");
        const expected = normalize(subject);
        const candidate = normalize(value);
        return candidate.includes(expected) || expected.includes(candidate);
    }

    private match(label: string, source: string, relevance: number): SearchMatch {
        return { label, source, relevance };
    }
}

export const knowledgeSearch = new SearchService();
