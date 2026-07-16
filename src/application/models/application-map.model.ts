export interface ApplicationPage {

    id: string;

    title: string;

    url: string;

}

export interface ApplicationMap {

    applicationName: string;

    pages: ApplicationPage[];

    createdAt: Date;

}