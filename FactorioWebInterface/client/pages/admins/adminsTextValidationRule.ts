import { IValidationRule, ValidationResult } from "../../utils/validation/module";

export class AdminsTextValidationRule implements IValidationRule<object>{
    validate(value: any): ValidationResult {
        if (!value || value.search(/[^,\s]/) === -1) {
            return ValidationResult.error('contain at least one non \',\' (comma) or \' \' (whitespace) character');
        } else {
            return ValidationResult.validResult;
        }
    }
}