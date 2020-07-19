import { ValidationResult } from "./ValidationResult";
import { PropertyValidation } from "./validationGroup";
import { assertValidationResultEqual } from "../../testUtils/utils/validation";
describe('PropertyValidation', function () {
    describe('validate', function () {
        const testCases = [
            {
                name: 'no rules gives valid result',
                object: { prop: 'not empty' },
                rule: new PropertyValidation('prop'),
                expected: ValidationResult.validResult
            },
            {
                name: 'single rule when valid gives valid result',
                object: { prop: 'not empty' },
                rule: new PropertyValidation('prop').notEmptyString(),
                expected: ValidationResult.validResult
            },
            {
                name: 'single rule when not valid gives error',
                object: { prop: '' },
                rule: new PropertyValidation('prop').notEmptyString(),
                expected: ValidationResult.error('prop must not be empty.')
            },
            {
                name: 'multiple rules when one not valid gives error',
                object: { prop: '' },
                rule: new PropertyValidation('prop').notEmptyString().notNull(),
                expected: ValidationResult.error('prop must not be empty.')
            },
            {
                name: 'multiple rules when all not valid gives error',
                object: { prop: null },
                rule: new PropertyValidation('prop').notEmptyString().notNull(),
                expected: ValidationResult.error('prop must not be empty and not be null.')
            },
            {
                name: 'multiple rules when valid gives valid result',
                object: { prop: 'not empty' },
                rule: new PropertyValidation('prop').notEmptyString().notNull(),
                expected: ValidationResult.validResult
            },
            {
                name: 'uses display name',
                object: { prop: '' },
                rule: new PropertyValidation('prop').displayName('display name').notEmptyString(),
                expected: ValidationResult.error('display name must not be empty.')
            },
        ];
        for (const testCase of testCases) {
            it(testCase.name, function () {
                // Act.
                const result = testCase.rule.validate(testCase.object);
                // Assert.
                assertValidationResultEqual(result, testCase.expected);
            });
        }
    });
});
//# sourceMappingURL=validationGroup.spec.js.map