import { NavigationModel } from "../models/navigation-model.js";

export class NavigationModelService {
    private readonly edges = new Map<string, NavigationModel>();

    learn(edge: Omit<NavigationModel, "learnedCount" | "lastUsedAt">): NavigationModel {
        const key = `${edge.fromPage}=>${edge.toPage}=>${edge.businessIntent}=>${edge.viaComponent ?? "-"}`;
        const existing = this.edges.get(key);

        const next: NavigationModel = {
            ...edge,
            learnedCount: (existing?.learnedCount ?? 0) + 1,
            lastUsedAt: new Date().toISOString()
        };

        this.edges.set(key, next);
        return next;
    }

    getAll(): NavigationModel[] {
        return [...this.edges.values()];
    }

    findByIntent(fromPage: string, intent: string, target: string | null): NavigationModel | undefined {
        return this.getAll().find(edge =>
            edge.fromPage === fromPage &&
            edge.businessIntent === intent &&
            (target ? (edge.viaComponent?.toLowerCase() === target.toLowerCase()) : true)
        );
    }
}

export const navigationModelService = new NavigationModelService();
