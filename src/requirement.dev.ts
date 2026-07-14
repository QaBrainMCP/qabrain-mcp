import { parseRequirement } from "./tools/parse-requirement.tool.js";

const feature = `
Feature: Login

Scenario: Valid Login

Given User opens Login page
When User enters Username
And User enters Password
Then Dashboard should be displayed
`;

const result = await parseRequirement(feature);

console.log(result);