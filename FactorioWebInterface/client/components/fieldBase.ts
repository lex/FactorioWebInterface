import "./fieldBase.ts.less";
import { BaseElement } from "./baseElement";

export abstract class FieldBase extends BaseElement {
    protected _property: string;

    get property(): string {
        return this._property;
    }

    abstract header: string;
    abstract value: any;
    abstract error: string

    abstract onChange(handler: (value: any) => void): () => void;
}