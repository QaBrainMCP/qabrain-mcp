import { ImpactReport } from "../models/impact.model.js";

export class ImpactRepository {
    private reports: ImpactReport[] = [];

    save(report: ImpactReport): ImpactReport {
        this.reports.push(report);
        return report;
    }

    getAll(): ImpactReport[] {
        return [...this.reports];
    }

    clear(): void {
        this.reports = [];
    }
}

export const impactRepository = new ImpactRepository();
