import { ExecutionContext } from "../../context/models/execution-context.js";
import { OptimizedContext } from "../models/optimized-context.js";

export class ContextOptimizerService {
    optimize(context: ExecutionContext): OptimizedContext {
        const cleanedDom = this.cleanDom(context.dom.html);
        const interactive = this.buildInteractiveSummary(cleanedDom);

        return {
            featureName: context.featureName,
            scenarioName: context.scenarioName,
            stepNumber: context.stepNumber,
            featureStep: context.featureStep,
            currentUrl: context.currentUrl,
            pageTitle: context.pageTitle,
            pageState: context.pageState,
            knownComponents: context.knowledgeSummary.knownComponents,
            knownLocators: context.knowledgeSummary.knownLocators,
            screenshotPath: context.afterScreenshot?.path ?? context.beforeScreenshot?.path ?? null,
            domSummary: {
                title: context.dom.title,
                bodyTextLength: context.dom.bodyTextLength,
                forms: context.dom.forms,
                buttons: context.dom.buttons,
                links: context.dom.links
            },
            interactiveComponentsSummary: interactive,
            navigationSummary: {
                currentUrl: context.currentUrl,
                pageTitle: context.pageTitle,
                currentModule: context.pageState.currentModule,
                currentActiveMenu: context.pageState.currentActiveMenu
            },
            cleanedDom
        };
    }

    private cleanDom(html: string): string {
        const withoutScriptsAndStyles = html
            .replace(/<script[\s\S]*?<\/script>/gi, "")
            .replace(/<style[\s\S]*?<\/style>/gi, "");

        const withoutDynamicIds = withoutScriptsAndStyles
            .replace(/\sid="[^"]*"/gi, "")
            .replace(/\sdata-v-[^=\s]+="[^"]*"/gi, "")
            .replace(/\sng-[^=\s]+="[^"]*"/gi, "")
            .replace(/\sdata-react[a-z-]*="[^"]*"/gi, "");

        const collapsedWhitespace = withoutDynamicIds
            .replace(/\s+/g, " ")
            .trim();

        return collapsedWhitespace;
    }

    private buildInteractiveSummary(cleanedDom: string): OptimizedContext["interactiveComponentsSummary"] {
        const visibleInteractiveElements = this.unique([
            ...this.captureText(cleanedDom, /<button[^>]*>(.*?)<\/button>/gi),
            ...this.captureText(cleanedDom, /<a[^>]*>(.*?)<\/a>/gi),
            ...this.captureAttribute(cleanedDom, /<(?:input|textarea|select)[^>]*\s(?:name|placeholder|aria-label)="([^"]+)"[^>]*>/gi)
        ]);

        return {
            visibleInteractiveElements,
            forms: this.count(cleanedDom, /<form\b/gi),
            buttons: this.count(cleanedDom, /<button\b/gi),
            inputs: this.count(cleanedDom, /<(?:input|textarea|select)\b/gi),
            links: this.count(cleanedDom, /<a\b/gi),
            menus: this.unique(this.captureText(cleanedDom, /<(?:nav|menu)[^>]*>(.*?)<\/(?:nav|menu)>/gi)),
            headings: this.unique(this.captureText(cleanedDom, /<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi)),
            tables: this.count(cleanedDom, /<table\b/gi),
            dialogs: this.count(cleanedDom, /<dialog\b|role="dialog"/gi),
            alerts: this.count(cleanedDom, /role="alert"|class="[^"]*alert[^"]*"/gi),
            navigationItems: this.unique(this.captureText(cleanedDom, /<a[^>]*>(.*?)<\/a>/gi)).slice(0, 40)
        };
    }

    private captureText(source: string, pattern: RegExp): string[] {
        const values: string[] = [];
        let match = pattern.exec(source);
        while (match) {
            const text = (match[1] ?? "").replace(/<[^>]+>/g, "").trim();
            if (text) {
                values.push(text);
            }
            match = pattern.exec(source);
        }
        return values;
    }

    private captureAttribute(source: string, pattern: RegExp): string[] {
        const values: string[] = [];
        let match = pattern.exec(source);
        while (match) {
            const text = (match[1] ?? "").trim();
            if (text) {
                values.push(text);
            }
            match = pattern.exec(source);
        }
        return values;
    }

    private count(source: string, pattern: RegExp): number {
        return source.match(pattern)?.length ?? 0;
    }

    private unique(values: string[]): string[] {
        return [...new Set(values.filter(Boolean))];
    }
}

export const contextOptimizerService = new ContextOptimizerService();
