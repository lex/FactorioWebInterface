import { Validator, ValidationResult } from "./module";
import { assertValidationResultEqual } from "../../testUtils/utils/validation";
import { PropertyValidation } from "./validationGroup";

describe('Validator', function () {
    describe('validate', function () {
        it('when key not found returns valid result', function () {
            // Arrange.            
            const validator = new Validator<object>({}, []);

            // Act.
            const result = validator.validate('missing key');

            // Assert.
            assertValidationResultEqual(result, ValidationResult.validResult);
        });

        it('when validation group is valid returns valid result', function () {
            // Arrange.            
            let object = { prop: 'not null' }
            const validator = new Validator<object>(object, [
                new PropertyValidation('prop').notNull()
            ]);

            // Act.
            const result = validator.validate('prop');

            // Assert.
            assertValidationResultEqual(result, ValidationResult.validResult);
        });

        it('when validation group is not valid returns error', function () {
            // Arrange.            
            let object = { prop: null }
            const validator = new Validator<object>(object, [
                new PropertyValidation('prop').notNull()
            ]);

            // Act.
            const result = validator.validate('prop');

            // Assert.
            const expected = ValidationResult.error('prop must not be null.');
            assertValidationResultEqual(result, expected);
        });
    });
});