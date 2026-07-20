export interface WorkflowContext {
    sessionId: string;
    application: string;
    feature?: string;
    pageName: string;
}

export default WorkflowContext;
