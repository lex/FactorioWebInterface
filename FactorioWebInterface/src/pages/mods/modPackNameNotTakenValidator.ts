import { ObservableCollection } from "../../utils/observableCollection";
import { ModPackMetaData } from "../servers/serversTypes";
import { IterableHelper } from "../../utils/iterableHelper";
import { IValidationRule, ValidationResult } from "../../utils/validation/module";

export class ModPackNameNotTakenValidator<T> implements IValidationRule<T>{
    constructor(private readonly modPacks: ObservableCollection<ModPackMetaData>) {
    }

    validate(value: string, obj?: T): ValidationResult {
        const nameLowerCase = value.toLowerCase();

        if (IterableHelper.any(this.modPacks.values(), modPack => modPack.Name.toLowerCase() === nameLowerCase)) {
            return ValidationResult.error(`be unique, mod pack '${value}' already exists`);
        }

        return ValidationResult.validResult;
    }
}
