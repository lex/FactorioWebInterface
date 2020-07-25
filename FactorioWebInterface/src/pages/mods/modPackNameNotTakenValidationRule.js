import { IterableHelper } from "../../utils/iterableHelper";
import { ValidationResult } from "../../utils/validation/module";
export class ModPackNameNotTakenValidationRule {
    constructor(modPacks) {
        this.modPacks = modPacks;
    }
    validate(value, obj) {
        const nameLowerCase = value.toLowerCase();
        if (IterableHelper.any(this.modPacks, modPack => modPack.Name.toLowerCase() === nameLowerCase)) {
            return ValidationResult.error(`be unique, mod pack '${value}' already exists`);
        }
        return ValidationResult.validResult;
    }
}
//# sourceMappingURL=modPackNameNotTakenValidationRule.js.map