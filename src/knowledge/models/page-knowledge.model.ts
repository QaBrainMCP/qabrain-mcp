import { Component } from "./component.model.js";

export interface PageKnowledge {
    id: string;
    title: string;
    url: string;
    buttons: Component[];
    links: Component[];
    inputs: Component[];
    dropdowns: Component[];
    forms: Component[];
    tables: Component[];
    dialogs: Component[];
    navigationTargets: string[];
    locators: string[];
    visitedCount: number;
    createdAt: Date;
    updatedAt: Date;
}
