import { ApplicationMap, ApplicationPage } from "../models/application-map.model.js";

export class ApplicationMapService {

    private map: ApplicationMap = {

        applicationName: "",

        pages: [],

        createdAt: new Date()

    };

    create(applicationName: string): ApplicationMap {

        this.map = {

            applicationName,

            pages: [],

            createdAt: new Date()

        };

        return this.map;

    }

    addPage(page: ApplicationPage): void {

        const exists = this.map.pages.some(p => p.url === page.url);

        if (!exists) {

            this.map.pages.push(page);

        }

    }

    getMap(): ApplicationMap {

        return this.map;

    }
    rememberCurrentPage(title: string, url: string): void {

    this.addPage({

        id: crypto.randomUUID(),

        title,

        url

    });

}

}

export const applicationMapService = new ApplicationMapService();