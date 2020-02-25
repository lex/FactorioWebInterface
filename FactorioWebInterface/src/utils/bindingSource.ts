import { ObservableObject } from "./observableObject";

export class BindingSource {
    constructor(public readonly source: ObservableObject, public readonly property: string) { }
}