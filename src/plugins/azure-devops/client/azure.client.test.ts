import { describe, expect, it } from "vitest";
import { AzureClient } from "./azure.client.js";

describe("AzureClient", () => {
    it("uses PAT basic authentication for Azure REST requests", async () => {
        let requestUrl = "";
        let authorization = "";
        const fetcher = async (input: string | URL | Request, init?: RequestInit) => {
            requestUrl = String(input);
            authorization = String((init?.headers as Record<string, string>).Authorization);
            return {
                ok: true,
                status: 200,
                json: async () => ({ value: [{ id: "1", name: "QaBrain", url: "https://example/project" }] })
            } as unknown as Response;
        };
        const client = new AzureClient(fetcher as typeof fetch);
        client.configure({ organizationUrl: "https://dev.azure.com/example", personalAccessToken: "token" });

        const projects = await client.listProjects();

        expect(requestUrl).toContain("/_apis/projects?api-version=7.1");
        expect(authorization).toBe(`Basic ${Buffer.from(":token").toString("base64")}`);
        expect(projects[0].name).toBe("QaBrain");
    });
});
