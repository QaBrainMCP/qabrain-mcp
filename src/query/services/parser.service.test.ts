import { describe, expect, it } from "vitest";
import { ParserService } from "./parser.service.js";

describe("ParserService", () => {
    it("parses supported component-page questions", () => {
        const query = new ParserService().parse("Which pages contain Login button?");

        expect(query).toEqual({
            question: "Which pages contain Login button?",
            intent: "PAGES_BY_COMPONENT",
            subject: "Login"
        });
    });
});
