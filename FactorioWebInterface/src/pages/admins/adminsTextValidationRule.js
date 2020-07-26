import { ValidationResult } from "../../utils/validation/module";
export class AdminsTextValidationRule {
    validate(value) {
        if (!value || value.search(/[^,\s]/) === -1) {
            return ValidationResult.error('contain at least one non \',\' (comma) or \' \' (whitespace) character');
        }
        else {
            return ValidationResult.validResult;
        }
    }
}
//# sourceMappingURL=adminsTextValidationRule.js.map