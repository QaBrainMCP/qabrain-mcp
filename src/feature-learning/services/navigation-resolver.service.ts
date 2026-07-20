import { ExecutionStep } from "../models/execution-step.model.js";

export type NavigationResolution =
    | {
        resolved: true;
        applicationName: string;
        url: string;
    }
    | {
        resolved: false;
    };

export class NavigationResolverService {
    resolve(step: ExecutionStep): NavigationResolution {
        const target = this.normalizeTarget(step.target);
        if (!target) {
            return { resolved: false };
        }

        if (this.isAbsoluteUrl(target)) {
            return {
                resolved: true,
                applicationName: target,
                url: target
            };
        }

        const env = process.env;
        const configuredApplicationName =
            env.TARGET_APP_NAME?.trim() ||
            env.APP_NAME?.trim() ||
            "Application";

        const configuredApplicationUrl =
            env.APP_URL?.trim() ||
            env.TARGET_APP_URL?.trim() ||
            "";

        if (!configuredApplicationUrl) {
            return { resolved: false };
        }

        const normalizedTarget = this.aliasKey(target);
        const aliases = this.buildAliases(configuredApplicationName);

        if (aliases.has(normalizedTarget)) {
            return {
                resolved: true,
                applicationName: configuredApplicationName,
                url: configuredApplicationUrl
            };
        }

        return { resolved: false };
    }

    private normalizeTarget(target: string | null): string | null {
        const trimmed = target?.trim();
        return trimmed ? trimmed : null;
    }

    private buildAliases(applicationName: string): Set<string> {
        const aliases = new Set<string>();
        aliases.add(this.aliasKey(applicationName));

        const envAliases = process.env.TARGET_APP_ALIASES
            ?.split(",")
            .map(item => item.trim())
            .filter(Boolean) ?? [];

        for (const alias of envAliases) {
            aliases.add(this.aliasKey(alias));
        }

        return aliases;
    }

    private aliasKey(value: string): string {
        return value.toLowerCase().replace(/[^a-z0-9]/g, "");
    }

    private isAbsoluteUrl(value: string): boolean {
        return /^https?:\/\//iu.test(value);
    }
}

export const navigationResolverService = new NavigationResolverService();
