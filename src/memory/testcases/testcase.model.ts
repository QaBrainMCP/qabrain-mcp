export interface TestCaseMemory {
  id: string;

  title: string;

  scenario: string;

  steps: string[];

  expectedResult: string;

  relatedPages: string[];

  learnedAt: Date;
}