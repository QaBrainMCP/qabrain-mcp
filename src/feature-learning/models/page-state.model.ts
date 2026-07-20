export interface NavigationState {
    isVisible: boolean;
    isCollapsed: boolean;
}

export interface PageState {
    currentPage: string;
    title: string;
    url: string;
    isAuthenticated: boolean;
    navigation: NavigationState;
    visibleDialogs: number;
    visibleOverlays: number;
    visibleLoaders: number;
    readyForInteraction: boolean;
    capturedAt: string;
}

export interface PageStatePreparation {
    initialState: PageState;
    finalState: PageState;
    adjustments: string[];
}
