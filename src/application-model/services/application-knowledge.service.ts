import { KnowledgeRepository, knowledgeRepository } from "../../knowledge/repository/knowledge.repository.js";
import { ApplicationModel } from "../models/application-model.js";
import { ApplicationComponentModel } from "../models/component-model.js";
import { NavigationModel } from "../models/navigation-model.js";
import { PageModel } from "../models/page-model.js";
import { navigationModelService, NavigationModelService } from "./navigation-model.service.js";

interface ApplicationKnowledgeDependencies {
    knowledgeRepository?: KnowledgeRepository;
    navigationModel?: NavigationModelService;
}

export class ApplicationKnowledgeService {
    private readonly model: ApplicationModel = {
        pages: [],
        modules: [],
        navigation: [],
        businessActions: [],
        updatedAt: new Date().toISOString()
    };

    constructor(
        private readonly knowledgeRepository: KnowledgeRepository = knowledgeRepository,
        private readonly navigationModel: NavigationModelService = navigationModelService
    ) {}

    static withDependencies(deps: ApplicationKnowledgeDependencies = {}): ApplicationKnowledgeService {
        return new ApplicationKnowledgeService(deps.knowledgeRepository ?? knowledgeRepository, deps.navigationModel ?? navigationModelService);
    }

    refreshFromRepository(): ApplicationModel {
        const pages = this.knowledgeRepository.getPages().map(page => this.toPageModel(page));
        this.model.pages = pages;
        this.model.modules = this.unique(pages.map(page => page.module).filter((m): m is string => Boolean(m)));
        this.model.navigation = this.navigationModel.getAll();
        this.model.updatedAt = new Date().toISOString();
        return this.model;
    }

    getModel(): ApplicationModel {
        return this.refreshFromRepository();
    }

    getCurrentPage(url: string): PageModel | undefined {
        const model = this.getModel();
        return model.pages.find(page => page.url === url);
    }

    learnNavigation(edge: Omit<NavigationModel, "learnedCount" | "lastUsedAt">): NavigationModel {
        const learned = this.navigationModel.learn(edge);
        this.model.navigation = this.navigationModel.getAll();
        return learned;
    }

    summary(): {
        pages: number;
        modules: number;
        navigationEdges: number;
        components: number;
    } {
        const model = this.getModel();
        const components = model.pages.reduce((acc, page) => acc + page.components.length, 0);
        return {
            pages: model.pages.length,
            modules: model.modules.length,
            navigationEdges: model.navigation.length,
            components
        };
    }

    navigationGraph(): Array<{ from: string; to: string; via: string | null }> {
        return this.navigationModel.getAll().map(edge => ({
            from: edge.fromPage,
            to: edge.toPage,
            via: edge.viaComponent
        }));
    }

    private toPageModel(page: ReturnType<KnowledgeRepository["getPages"]>[number]): PageModel {
        const components = [
            ...page.buttons.map(component => this.toComponent(component.name, "button", component.selector)),
            ...page.links.map(component => this.toComponent(component.name, "link", component.selector)),
            ...page.inputs.map(component => this.toComponent(component.name, "input", component.selector)),
            ...page.dropdowns.map(component => this.toComponent(component.name, "dropdown", component.selector)),
            ...page.forms.map(component => this.toComponent(component.name, "form", component.selector)),
            ...page.tables.map(component => this.toComponent(component.name, "table", component.selector)),
            ...page.dialogs.map(component => this.toComponent(component.name, "dialog", component.selector))
        ];

        return {
            id: page.id,
            title: page.title,
            url: page.url,
            module: this.moduleFromUrl(page.url),
            expectedHeadings: this.unique([page.title, this.moduleFromUrl(page.url) ?? ""].filter(Boolean)),
            components,
            knownLocators: [...new Set(page.locators)],
            visitCount: page.visitedCount,
            lastSeenAt: page.updatedAt.toISOString()
        };
    }

    private toComponent(name: string, type: ApplicationComponentModel["type"], locator: string): ApplicationComponentModel {
        return {
            name,
            type,
            locators: locator ? [locator] : [],
            businessActions: []
        };
    }

    private moduleFromUrl(url: string): string | null {
        const parts = url.split("/").filter(Boolean);
        const index = parts.findIndex(part => part.toLowerCase() === "index.php");
        if (index === -1 || index + 1 >= parts.length) {
            return null;
        }
        const segment = parts[index + 1] ?? "";
        const normalized = segment.split("view").pop() ?? segment;
        return normalized || null;
    }

    private unique(values: string[]): string[] {
        return [...new Set(values.filter(Boolean))];
    }
}

export const applicationKnowledgeService = ApplicationKnowledgeService.withDependencies();
