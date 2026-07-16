import { ApplicationPage } from "../../application/models/application-map.model.js";

export class PageMapperService {
    map(pageNames: readonly string[], applicationPages: readonly ApplicationPage[]): string[] {
        return applicationPages
            .filter(page => pageNames.some(name => this.matches(name, page.title)))
            .map(page => page.title);
    }

    private matches(requirementPage: string, applicationPage: string): boolean {
        const expected = requirementPage.toLowerCase();
        const known = applicationPage.toLowerCase();
        return known.includes(expected) || expected.includes(known);
    }
}

export const pageMapperService = new PageMapperService();
