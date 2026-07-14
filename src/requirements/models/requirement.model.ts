export interface Scenario {

    name: string;

    steps: string[];

}

export interface Requirement {

    id: string;

    title: string;

    description: string;

    scenarios: Scenario[];

}