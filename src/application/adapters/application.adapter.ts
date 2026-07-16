import { Page } from "playwright";

export interface ApplicationAdapter {
    readonly name: string;

    login(page: Page): Promise<void>;

    verify(page: Page): Promise<boolean>;
}