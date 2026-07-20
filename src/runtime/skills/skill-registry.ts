import type { AISkill } from "./skill-engine.js";

const registry = new Map<string, AISkill>();

export function registerSkill(skill: AISkill) {
    registry.set(skill.name, skill);
}

export function getSkill(name: string) {
    return registry.get(name);
}

export function listSkills() {
    return Array.from(registry.values()).map(s => ({ name: s.name, description: s.description }));
}
