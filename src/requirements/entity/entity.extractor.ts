import { Step } from "../models/step.model.js";
import { Entity } from "./entity.model.js";

export class EntityExtractor {

    extract(step: Step): Entity[] {

        const entities: Entity[] = [];

        const text = step.text;

        if (text.includes("page")) {

            entities.push({
                type: "PAGE",
                value: text
            });

        }

        if (
            text.includes("Username") ||
            text.includes("Password")
        ) {

            entities.push({
                type: "FIELD",
                value: text
            });

        }

        if (text.includes("click")) {

            entities.push({
                type: "BUTTON",
                value: text
            });

        }

        return entities;

    }

}

export const entityExtractor = new EntityExtractor();