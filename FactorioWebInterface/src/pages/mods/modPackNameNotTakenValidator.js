import { ValidationRule, ValidationResult } from "../../utils/validator";
import { IterableHelper } from "../../utils/iterableHelper";
export class ModPackNameNotTakenValidator extends ValidationRule {
    constructor(propertyName, modPacks) {
        super(propertyName, (obj) => {
            let name = obj[propertyName];
            let nameLowerCase = name.toLowerCase();
            if (IterableHelper.any(modPacks.values(), modPack => modPack.Name.toLowerCase() === name)) {
                return ValidationResult.error(`Mod Pack with name '${name}' already exists.`);
            }
            return ValidationResult.validResult;
        });
    }
}
//# sourceMappingURL=modPackNameNotTakenValidator.js.map