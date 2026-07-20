export function analyzeGoal(goal: string): string {
    const g = (goal ?? '').toLowerCase();
    if (/page object|pageobject|page object/i.test(goal)) return 'generate_page_object';
    if (/step defs|step definitions|step-definitions|step definitions/i.test(goal)) return 'generate_step_definitions';
    if (/generate test|test generation|tests?/i.test(goal)) return 'generate_test';
    if (/repair|fix|heal/i.test(goal)) return 'repair_automation';
    if (/explain page|explain feature|explain/i.test(goal)) return 'explain_page';
    // composite goals
    if (/complete automation|generate complete automation|generate automation/i.test(goal)) return 'generate_complete_automation';
    // default: try to infer page object
    return 'generate_page_object';
}
