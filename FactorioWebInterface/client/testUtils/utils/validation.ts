import { ValidationResult } from "../../utils/validation/module";
import { strict } from "assert";

export function assertValidationResultEqual(actaul: ValidationResult, expected: ValidationResult) {
    strict.equal(actaul.valid, expected.valid);
    strict.equal(actaul.error, expected.error);
}