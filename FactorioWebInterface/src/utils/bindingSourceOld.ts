import { ObservableObject } from "./observableObject";

export class BindingSourceOld {
    constructor(public readonly source: ObservableObject, public readonly property: string) { }
}