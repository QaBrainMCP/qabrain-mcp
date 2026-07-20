export interface PageState {
    currentPage: string;
    loggedIn: boolean;
    sidebarExpanded: boolean;
    modalOpen: boolean;
    loadingSpinner: boolean;
    toastMessage: boolean;
    errorBanner: boolean;
    currentModule: string | null;
    currentActiveMenu: string | null;
    readyForInteraction: boolean;
}
