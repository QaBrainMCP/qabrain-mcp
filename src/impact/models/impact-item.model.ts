export type ImpactItemType = "PAGE" | "REQUIREMENT" | "WORKFLOW" | "COMPONENT";

export interface ImpactItem {
    type: ImpactItemType;
    name: string;
}
