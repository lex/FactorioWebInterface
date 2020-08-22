import { ModPackMetaData } from "../servers/serversTypes";
import { IterableHelper } from "../../utils/iterableHelper";
import { IValidationRule, ValidationResult } from "../../utils/validation/module";

export class ModPackNameNotTakenValidationRule<T> implements IValidationRule<T>{
    constructor(private readonly modPacks: Iterable<ModPackMetaData>) {
    }

    validate(value: string, obj?: T): ValidationResult {
        const nameLowerCase = value.toLowerCase();

        if (IterableHelper.any(this.modPacks, modPack => modPack.Name.toLowerCase() === nameLowerCase)) {
            return ValidationResult.error(`be unique, mod pack '${value}' already exists`);
        }

        return ValidationResult.validResult;
    }
}
