import { describe, expect, it } from "vitest";
import { RankingService } from "./ranking.service.js";

describe("RankingService", () => {
    it("orders higher-confidence matches first and removes duplicates", () => {
        const ranked = new RankingService().rank([
            { label: "Admin Login", source: "map", relevance: 80 },
            { label: "Login", source: "knowledge", relevance: 100 },
            { label: "Login", source: "workflow", relevance: 90 }
        ]);

        expect(ranked.map(match => match.label)).toEqual(["Login", "Admin Login"]);
    });
});
