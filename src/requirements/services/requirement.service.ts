import { Requirement } from "../models/requirement.model.js";
import { gherkinParser } from "../parser/gherkin.parser.js";

export class RequirementService {

    parse(feature: string): Requirement {

        return gherkinParser.parse(feature);

    }

}

export const requirementService = new RequirementService();