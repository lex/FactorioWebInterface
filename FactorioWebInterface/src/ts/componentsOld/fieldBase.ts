import { ComponentBase } from "./componentBase";
import { ValidationResult } from "../utilsOld/validator";

export abstract class FieldBase extends ComponentBase {
    private static count: number = 1;

    static getId(): string {
        return 'field' + FieldBase.count++;
    }

    constructor(private _property: string, private _header) {
        super();
    }

    get property() {
        return this._property;
    }

    get header() {
        return this._header;
    }

    abstract value: any;
    abstract set valid(validationResult: ValidationResult);
    abstract enabled: boolean;

    abstract onChange(hander: () => void): void;
}
