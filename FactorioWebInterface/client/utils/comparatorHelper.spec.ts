import { strict } from "assert";
import { ComparatorHelper } from "./comparatorHelper";

describe('ComparatorHelper', function () {
    describe('patchStringComparator', function () {
        let testCases = [
            { name: 'empty', input: [], expected: [] },
            { name: 'numbers', input: ['1.1.1', '1.1.0', '1.0.1', '1.0.0'], expected: ['1.0.0', '1.0.1', '1.1.0', '1.1.1'] },
            { name: 'numbers2', input: ['1.1.0', '1.0.20', '1.0.12', '1.0.10', '1.0.2', '1.0.1', '1.0.0'], expected: ['1.0.0', '1.0.1', '1.0.2', '1.0.10', '1.0.12', '1.0.20', '1.1.0'] },
            { name: 'latest first', input: ['1.0.0', 'latest'], expected: ['latest', '1.0.0'] },
            { name: 'mismatch', input: ['1.0.0', '1.0', '1'], expected: ['1', '1.0', '1.0.0'] },

            // The order is not important, just that they don't throw an exception.
            { name: 'empty parts', input: ['..', '1.0.', '.1'], expected: ['..', '.1', '1.0.'] },
            { name: 'words', input: ['1.0.0', 'factorio'], expected: ['factorio', '1.0.0'] },
        ];

        for (let testCase of testCases) {
            it(testCase.name, function () {
                let actual = testCase.input.sort(ComparatorHelper.patchStringComparator);
                strict.deepEqual(actual, testCase.expected);
            })
        }
    });
});