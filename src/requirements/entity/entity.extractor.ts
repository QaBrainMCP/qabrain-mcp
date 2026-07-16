import { Step } from "../models/step.model.js";
import { Entity } from "./entity.model.js";

export class EntityExtractor {

    extract(step: Step): Entity[] {

        const entities: Entity[] = [];

        const text = step.text;

        const pageMatch = text.match(/(?:open(?:s)?|navigate(?:s)? to)\s+(.+?)\s+page/i)
            ?? text.match(/^(.+?)\s+should\s+be\s+(?:displayed|shown|visible)/i);

        if (pageMatch) {

            entities.push({
                type: "PAGE",
                value: pageMatch[1].replace(/^User\s+/i, "").trim()
            });

        }

        if (
            text.includes("Username") ||
            text.includes("Password")
        ) {

            for (const field of ["Username", "Password"]) {
                if (text.includes(field)) {
                    entities.push({ type: "FIELD", value: field });
                }
            }

        }

        const buttonMatch = text.match(/(?:clicks?|press(?:es)?|selects?)\s+(.+)/i);

        if (buttonMatch) {

            entities.push({
                type: "BUTTON",
                value: `${buttonMatch[1].trim()} Button`
            });

        }

        return entities;

    }

}

export const entityExtractor = new EntityExtractor();
