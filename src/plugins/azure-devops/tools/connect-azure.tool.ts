import { AzureAuthenticationInput, authenticationService } from "../services/authentication.service.js";

export async function connectAzure(input: AzureAuthenticationInput) {
    return authenticationService.connect(input);
}
