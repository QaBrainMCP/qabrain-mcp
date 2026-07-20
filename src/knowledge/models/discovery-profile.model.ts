export interface DiscoveryProfile {
    name: string;
    include: Array<
        | "buttons"
        | "links"
        | "menuItems"
        | "textboxes"
        | "dropdowns"
        | "textareas"
        | "headings"
        | "labels"
        | "breadcrumbs"
        | "titles"
        | "tabs"
        | "tableHeaders"
        | "sidebar"
        | "menu"
        | "navbar"
        | "inputs"
        | "tables"
        | "forms"
        | "dialogs"
    >;
}

export default DiscoveryProfile;
