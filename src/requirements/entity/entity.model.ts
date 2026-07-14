export type EntityType =
    | "PAGE"
    | "FIELD"
    | "BUTTON"
    | "MESSAGE"
    | "UNKNOWN";

export interface Entity {

    type: EntityType;

    value: string;

}