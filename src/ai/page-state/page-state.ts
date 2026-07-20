export interface Viewport {
    width: number;
    height: number;
}

export interface VisibleComponentsSummary {
    buttons: number;
    inputs: number;
    links: number;
    dropdowns: number;
    forms: number;
    tables: number;
    headings: number;
}

export interface PageState {
    pageName: string | null;
    url: string;
    title: string;
    isLoggedIn: boolean;
    pageReady: boolean;
    sidebarVisible: boolean;
    sidebarExpanded: boolean;
    modalOpen: boolean;
    dialogOpen: boolean;
    loading: boolean;
    spinnerVisible: boolean;
    toastVisible: boolean;
    errorVisible: boolean;
    activeMenu: string | null;
    breadcrumbs: string[];
    visibleForms: number;
    visibleTables: number;
    visibleButtons: number;
    visibleInputs: number;
    visibleLinks: number;
    visibleHeadings: number;
    focusedElement: string | null;
    viewport: Viewport | null;
    timestamp: string;
}

export default PageState;
