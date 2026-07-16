import { describe, expect, it } from "vitest";
import { AzureClient } from "../client/azure.client.js";
import { AzureRepository } from "../repository/azure.repository.js";
import { AuthenticationService } from "./authentication.service.js";

describe("AuthenticationService", () => {
    it("configures Azure authentication without persisting the PAT", () => {
        const repository = new AzureRepository();
        const connection = new AuthenticationService(new AzureClient(), repository).connect({
            organizationUrl: "https://dev.azure.com/example/",
            projectName: "QaBrain",
            personalAccessToken: "secret-pat"
        });

        expect(connection).toMatchObject({
            organizationUrl: "https://dev.azure.com/example",
            projectName: "QaBrain"
        });
        expect(JSON.stringify(repository.getConnection())).not.toContain("secret-pat");
    });
});
