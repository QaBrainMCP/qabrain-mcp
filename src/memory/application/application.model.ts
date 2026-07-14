export interface ApplicationMemory {
  id: string;
  name: string;
  baseUrl: string;

  pages: string[];
  workflows: string[];
  testCases: string[];
  locators: string[];

  createdAt: Date;
  updatedAt: Date;
}