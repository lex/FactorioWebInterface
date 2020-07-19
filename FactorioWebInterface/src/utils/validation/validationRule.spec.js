import { ValidationResult } from "./ValidationResult";
import { NotEmptyString, NoWhitespaceString, NotNull, MaxStringLength, MinMaxStringLength, EqualToOtherString } from "./validationRule";
import { assertValidationResultEqual } from "../../testUtils/utils/validation";
describe('ValidationRule', function () {
    describe('NotEmptyString', function () {
        const testCases = [
            { name: 'null', value: null, expected: ValidationResult.error('not be empty') },
            { name: 'undefined', value: undefined, expected: ValidationResult.error('not be empty') },
            { name: 'empty string', value: '', expected: ValidationResult.error('not be empty') },
            { name: 'not empty string', value: 'string', expected: ValidationResult.validResult },
        ];
        for (const testCase of testCases) {
            it(testCase.name, function () {
                // Arrange.
                const rule = new NotEmptyString();
                // Act.
                const result = rule.validate(testCase.value);
                // Assert.
                assertValidationResultEqual(result, testCase.expected);
            });
        }
    });
    describe('NoWhitespaceString', function () {
        const testCases = [
            { name: 'single space', value: ' ', expected: ValidationResult.error('not contain whitespace characters') },
            { name: 'multiple space', value: '  ', expected: ValidationResult.error('not contain whitespace characters') },
            { name: 'tab', value: '\t', expected: ValidationResult.error('not contain whitespace characters') },
            { name: 'newline', value: '\n', expected: ValidationResult.error('not contain whitespace characters') },
            { name: 'abc def', value: 'abc def', expected: ValidationResult.error('not contain whitespace characters') },
            { name: ' abc def ', value: ' abc def ', expected: ValidationResult.error('not contain whitespace characters') },
            { name: 'not whitespaces', value: 'string', expected: ValidationResult.validResult },
            { name: 'empty string', value: '', expected: ValidationResult.validResult },
            { name: 'null', value: null, expected: ValidationResult.validResult },
            { name: 'undefined', value: undefined, expected: ValidationResult.validResult }
        ];
        for (const testCase of testCases) {
            it(testCase.name, function () {
                // Arrange.
                const rule = new NoWhitespaceString();
                // Act.
                const result = rule.validate(testCase.value);
                // Assert.
                assertValidationResultEqual(result, testCase.expected);
            });
        }
    });
    describe('NotNull', function () {
        const testCases = [
            { name: 'null', value: null, expected: ValidationResult.error('not be null') },
            { name: 'undefined', value: undefined, expected: ValidationResult.error('not be null') },
            { name: 'empty object', value: {}, expected: ValidationResult.validResult },
            { name: 'empty string', value: '', expected: ValidationResult.validResult },
            { name: 'zero', value: 0, expected: ValidationResult.validResult },
            { name: 'empty array', value: [], expected: ValidationResult.validResult },
        ];
        for (const testCase of testCases) {
            it(testCase.name, function () {
                // Arrange.
                const rule = new NotNull();
                // Act.
                const result = rule.validate(testCase.value);
                // Assert.
                assertValidationResultEqual(result, testCase.expected);
            });
        }
    });
    describe('MaxStringLength', function () {
        const testCases = [
            { name: 'too long max 2', value: '123', max: 2, expected: ValidationResult.error('not be longer than 2 characters but is 3') },
            { name: 'too long max 5', value: '1234567890', max: 5, expected: ValidationResult.error('not be longer than 5 characters but is 10') },
            { name: 'empty string when max is 0', value: '', max: 0, expected: ValidationResult.validResult },
            { name: 'null when max is 0', value: null, max: 0, expected: ValidationResult.validResult },
            { name: 'undefined when max is 0', value: undefined, max: 0, expected: ValidationResult.validResult },
            { name: 'empty string when max is 1', value: '', max: 1, expected: ValidationResult.validResult },
            { name: 'null when max is 1', value: null, max: 1, expected: ValidationResult.validResult },
            { name: 'undefined when max is 1', value: undefined, max: 1, expected: ValidationResult.validResult },
            { name: 'less than max 2', value: '1', max: 2, expected: ValidationResult.validResult },
            { name: 'less than max 5', value: '123', max: 5, expected: ValidationResult.validResult },
        ];
        for (const testCase of testCases) {
            it(testCase.name, function () {
                // Arrange.
                const rule = new MaxStringLength(testCase.max);
                // Act.
                const result = rule.validate(testCase.value);
                // Assert.
                assertValidationResultEqual(result, testCase.expected);
            });
        }
    });
    describe('MinMaxStringLength', function () {
        const testCases = [
            { name: 'too short min 2', value: '1', min: 2, max: 2, expected: ValidationResult.error('be between 2 and 2 characters but is 1') },
            { name: 'too short min 5', value: '123', min: 5, max: 10, expected: ValidationResult.error('be between 5 and 10 characters but is 3') },
            { name: 'null when min 1', value: null, min: 1, max: 2, expected: ValidationResult.error('be between 1 and 2 characters but is null') },
            { name: 'undefined when min 1', value: undefined, min: 1, max: 2, expected: ValidationResult.error('be between 1 and 2 characters but is null') },
            { name: 'empty string when min is 1', value: '', min: 1, max: 2, expected: ValidationResult.error('be between 1 and 2 characters but is 0') },
            { name: 'too long max 2', value: '123', min: 0, max: 2, expected: ValidationResult.error('be between 0 and 2 characters but is 3') },
            { name: 'too long max 5', value: '1234567890', min: 0, max: 5, expected: ValidationResult.error('be between 0 and 5 characters but is 10') },
            { name: 'empty string when min and max is 0', value: '', min: 0, max: 0, expected: ValidationResult.validResult },
            { name: 'null when min and max is 0', value: null, min: 0, max: 0, expected: ValidationResult.validResult },
            { name: 'undefined when min and max is 0', value: undefined, min: 0, max: 0, expected: ValidationResult.validResult },
            { name: 'empty string when min is 0 and max is 1', value: '', min: 0, max: 1, expected: ValidationResult.validResult },
            { name: 'null when min is 0 and max is 1', value: null, min: 0, max: 1, expected: ValidationResult.validResult },
            { name: 'undefined when min is 0 and max is 1', value: undefined, min: 0, max: 1, expected: ValidationResult.validResult },
            { name: 'valid min 0 max 2', value: '1', min: 0, max: 2, expected: ValidationResult.validResult },
            { name: 'valid min 0 max 5', value: '123', min: 0, max: 5, expected: ValidationResult.validResult },
        ];
        for (const testCase of testCases) {
            it(testCase.name, function () {
                // Arrange.
                const rule = new MinMaxStringLength(testCase.min, testCase.max);
                // Act.
                const result = rule.validate(testCase.value);
                // Assert.
                assertValidationResultEqual(result, testCase.expected);
            });
        }
    });
    describe('EqualToOtherString', function () {
        const testCases = [
            { name: 'both strings not same', value: '123', other: '456', expected: ValidationResult.error('be equal to other') },
            { name: 'both strings not same2', value: '123456', other: '123', expected: ValidationResult.error('be equal to other') },
            { name: 'one empty other not', value: '', other: '123', expected: ValidationResult.error('be equal to other') },
            { name: 'one empty other null', value: '', other: null, expected: ValidationResult.error('be equal to other') },
            { name: 'one empty other undefined', value: '', other: undefined, expected: ValidationResult.error('be equal to other') },
            { name: 'not equal with display name', value: '123', other: '456', otherDispalyName: 'display name', expected: ValidationResult.error('be equal to display name') },
            { name: 'both null', value: null, other: null, expected: ValidationResult.validResult },
            { name: 'both undefined', value: undefined, other: undefined, expected: ValidationResult.validResult },
            { name: 'both empty string', value: '', other: '', expected: ValidationResult.validResult },
            { name: 'both same string', value: '123', other: '123', expected: ValidationResult.validResult },
            { name: 'both same string2', value: '123456', other: '123456', expected: ValidationResult.validResult }
        ];
        for (const testCase of testCases) {
            it(testCase.name, function () {
                // Arrange.
                const rule = new EqualToOtherString('other', testCase.otherDispalyName);
                // Act.
                const result = rule.validate(testCase.value, { other: testCase.other });
                // Assert.
                assertValidationResultEqual(result, testCase.expected);
            });
        }
    });
});
//# sourceMappingURL=validationRule.spec.js.map