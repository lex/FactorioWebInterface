import { strict } from "assert";
import { AdminsPageTestServiceLocator } from "../../testUtils/testServiceLocator";
import { AdminsViewModel } from "./adminsViewModel";
import { AdminsHubService } from "./adminsHubService";
import { CollectionChangeType } from "../../ts/utils";
import { IterableHelper } from "../../utils/iterableHelper";
import { ValidationResult } from "../../utils/validation/module";
import { assertValidationResultEqual } from "../../testUtils/utils/validation";
const admins = [
    { Name: 'hij' },
    { Name: 'def' },
    { Name: 'abc' },
];
describe('AdminsViewModel', function () {
    it('requests admins when first loading', function () {
        // Arrange.
        let services = new AdminsPageTestServiceLocator();
        let hub = services.get(AdminsHubService);
        hub.methodCalled.subscribe(event => {
            if (event.name === 'whenConnection') {
                const callback = event.args[0];
                callback();
            }
        });
        // Act.
        let viewModel = services.get(AdminsViewModel);
        // Assert.
        hub.assertMethodCalled('requestAdmins');
    });
    it('requests admins when hub connection starts', function () {
        // Arrange.
        let services = new AdminsPageTestServiceLocator();
        let hub = services.get(AdminsHubService);
        let viewModel = services.get(AdminsViewModel);
        // Act.
        hub._onConnection.raise();
        // Assert.
        hub.assertMethodCalled('requestAdmins');
    });
    it('admins collection updates onSendAdmins', function () {
        // Arrange.
        let services = new AdminsPageTestServiceLocator();
        let hub = services.get(AdminsHubService);
        let viewModel = services.get(AdminsViewModel);
        // Act.
        hub._onSendAdmins.raise({ Type: CollectionChangeType.Reset, NewItems: admins });
        // Assert.
        let actual = IterableHelper.map(viewModel.admins.values(), a => a.value.Name);
        // names should be sorted.
        let expected = ['abc', 'def', 'hij'];
        strict.deepEqual([...actual], expected);
    });
    describe('addAdminText validation', function () {
        const validationError = ValidationResult.error('Text must contain at least one non \',\' (comma) or \' \' (whitespace) character.');
        const testCases = [
            { name: 'empty string', text: '', expected: validationError },
            { name: 'null', text: null, expected: validationError },
            { name: 'undefined', text: undefined, expected: validationError },
            { name: 'only commas', text: ',', expected: validationError },
            { name: 'only whitespace', text: ' ', expected: validationError },
            { name: 'one name', text: 'abc', expected: ValidationResult.validResult },
            { name: 'two names', text: 'abc,def', expected: ValidationResult.validResult }
        ];
        for (let testCase of testCases) {
            it(testCase.name, function () {
                // Arrange.
                let services = new AdminsPageTestServiceLocator();
                let viewModel = services.get(AdminsViewModel);
                // Act.
                viewModel.addAdminsText = 'some value';
                viewModel.addAdminsText = testCase.text;
                // Assert.
                let result = viewModel.errors.getError('addAdminsText');
                assertValidationResultEqual(result, testCase.expected);
            });
        }
    });
    describe('add admins command', function () {
        it('can not execute when validation error', function () {
            // Arrange.
            let services = new AdminsPageTestServiceLocator();
            let viewModel = services.get(AdminsViewModel);
            let hub = services.get(AdminsHubService);
            // Act.
            viewModel.addAdminsCommand.execute();
            // Assert.
            strict.equal(viewModel.addAdminsCommand.canExecute(), false);
            hub.assertMethodNotCalled('addAdmins');
        });
        it('can execute when addAdminsText valid', function () {
            // Arrange.
            let services = new AdminsPageTestServiceLocator();
            let viewModel = services.get(AdminsViewModel);
            viewModel.addAdminsText = 'abc';
            let hub = services.get(AdminsHubService);
            let data;
            hub.methodCalled.subscribe(event => {
                if (event.name === 'addAdmins') {
                    data = event.args[0];
                }
            });
            // Act.
            strict.equal(viewModel.addAdminsCommand.canExecute(), true);
            viewModel.addAdminsCommand.execute();
            // Assert.
            strict.equal(data, 'abc');
        });
    });
    describe('remove admin command', function () {
        it('removes admin', function () {
            // Arrange.
            let services = new AdminsPageTestServiceLocator();
            let viewModel = services.get(AdminsViewModel);
            let hub = services.get(AdminsHubService);
            let name;
            hub.methodCalled.subscribe(event => {
                if (event.name === 'removeAdmin') {
                    name = event.args[0];
                }
            });
            hub._onSendAdmins.raise({ Type: CollectionChangeType.Reset, NewItems: admins });
            // Act.
            viewModel.removeAdminCommand.execute(admins[0]);
            // Assert.
            strict.equal(name, admins[0].Name);
        });
    });
});
//# sourceMappingURL=adminsViewModel.spec.js.map