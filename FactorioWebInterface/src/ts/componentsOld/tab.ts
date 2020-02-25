import { ComponentBase } from "./componentBase";
import { BasicComponent } from "./BasicComponent";

export class Tab {
    constructor(public header: BasicComponent | string, public body: ComponentBase) {
    }
}