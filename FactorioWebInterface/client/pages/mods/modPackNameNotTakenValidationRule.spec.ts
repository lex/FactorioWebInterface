import { ModPackNameNotTakenValidationRule } from "./modPackNameNotTakenValidationRule";
import { assertValidationResultEqual } from "../../testUtils/utils/validation";
import { ValidationResult } from "../../utils/validation/module";
import { ModPackMetaData } from "../servers/serversTypes";

describe('ModPackNameNotTakenValidationRule', function () {
    const modPack: ModPackMetaData = {
        Name: 'name',
        CreatedTime: '2020-01-01 00:00:00',
        LastModifiedTime: '2020-01-01 00:00:00'
    };

    const modPack2: ModPackMetaData = {
        Name: 'name2',
        CreatedTime: '2020-01-02 00:00:00',
        LastModifiedTime: '2020-01-02 00:00:00'
    };

    const modPack3: ModPackMetaData = {
        Name: 'NAME3',
        CreatedTime: '2020-01-03 00:00:00',
        LastModifiedTime: '2020-01-03 00:00:00'
    };

    describe('mod pack taken', function () {
        const takenTestCases = [
            { name: 'one pack', modPacks: [modPack], value: modPack.Name, error: ValidationResult.error('be unique, mod pack \'name\' already exists') },
            { name: 'three packs pack', modPacks: [modPack, modPack2, modPack3], value: modPack2.Name, error: ValidationResult.error('be unique, mod pack \'name2\' already exists') },
            { name: 'mod pack upper case', modPacks: [modPack, modPack2, modPack3], value: 'name3', error: ValidationResult.error('be unique, mod pack \'name3\' already exists') },
            { name: 'value upper case', modPacks: [modPack, modPack2, modPack3], value: 'NAME2', error: ValidationResult.error('be unique, mod pack \'NAME2\' already exists') }
        ];

        for (const testCase of takenTestCases) {
            it(testCase.name, function () {
                // Arrange.
                let rule = new ModPackNameNotTakenValidationRule(testCase.modPacks);

                // Act.
                let result = rule.validate(testCase.value);

                // Assert.
                assertValidationResultEqual(result, testCase.error);
            });
        }
    });

    describe('mod pack not taken', function () {
        const takenTestCases = [
            { name: 'no packs', modPacks: [], value: 'name' },
            { name: 'one packs', modPacks: [modPack], value: 'different name' },
            { name: 'three packs', modPacks: [modPack, modPack2, modPack3], value: 'different name' }
        ];

        for (const testCase of takenTestCases) {
            it(testCase.name, function () {
                // Arrange.
                let rule = new ModPackNameNotTakenValidationRule(testCase.modPacks);

                // Act.
                let result = rule.validate(testCase.value);

                // Assert.
                assertValidationResultEqual(result, ValidationResult.validResult);
            });
        }
    });
});