export interface TestCase {

    id: string;

    feature?: string;

    scenario: string;

    steps: string[];

    relatedPages: string[];

    relatedLocators: string[];

    createdAt: Date;

}