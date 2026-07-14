import { navigationManager } from "../browser/navigation.manager.js";

export async function openUrl(url: string) {
    await navigationManager.open(url);
}