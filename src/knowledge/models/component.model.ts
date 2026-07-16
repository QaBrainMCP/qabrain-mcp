export type ComponentType =
    | "button"
    | "link"
    | "input"
    | "dropdown"
    | "form"
    | "table"
    | "dialog";

export interface Component {
    type: ComponentType;
    name: string;
    selector: string;
}
