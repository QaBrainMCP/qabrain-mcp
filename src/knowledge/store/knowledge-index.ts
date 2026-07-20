export interface KnowledgeIndex {
    applications: string[];
    pages: string[]; // pageIds
    components: string[]; // componentIds
    locators: string[]; // locatorIds
    navigation: number; // count
}

export default KnowledgeIndex;
