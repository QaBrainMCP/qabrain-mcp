export function chooseStrategy(decision: string) {
    if (decision === 'repository_complete') return 'execute_skills_sequential';
    if (decision === 'learning_required') return 'recommend_learning_then_generate';
    if (decision === 'repair_required') return 'repair_then_generate';
    return 'execute_skills_sequential';
}
