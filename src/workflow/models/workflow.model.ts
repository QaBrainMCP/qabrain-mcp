export interface Workflow {

    id: string;

    name: string;

    application: string;

    pages: string[];

    actions: string[];

    locators: string[];

    createdAt: Date;

}