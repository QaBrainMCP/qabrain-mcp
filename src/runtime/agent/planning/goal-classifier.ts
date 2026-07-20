export function classifyGoal(goal: string) {
    const g = (goal ?? '').toLowerCase();
    if (g.includes('page object')) return 'page_object';
    if (g.includes('step') || g.includes('step definitions')) return 'step_definitions';
    if (g.includes('test')) return 'test';
    if (g.includes('repair')) return 'repair';
    if (g.includes('explain')) return 'explain';
    if (g.includes('complete') || (g.includes('generate') && g.includes('automation'))) return 'complete_automation';
    return 'page_object';
}
