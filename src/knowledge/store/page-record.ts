export interface PageRecord {
    pageId: string;
    pageName: string;
    urlPattern: string;
    title?: string;
    application?: string;
    discoveredDate: string;
    lastUpdated: string;
    components: string[]; // componentIds
    navigationLinks: string[]; // target pageIds or urls
}

export default PageRecord;
