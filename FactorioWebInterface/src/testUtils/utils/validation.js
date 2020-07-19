import { strict } from "assert";
export function assertValidationResultEqual(actaul, expected) {
    strict.equal(actaul.valid, expected.valid);
    strict.equal(actaul.error, expected.error);
}
//# sourceMappingURL=validation.js.map