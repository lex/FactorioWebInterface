import { strict } from "assert";
import { AccountPageTestServiceLocator } from "../../testUtils/testServiceLocator";
import { AccountViewModel } from "./accountViewModel";
import { UploadService } from "../../services/uploadService";
describe('AccountViewModel', function () {
    describe('password validation', function () {
        it('when password too short there is validation error', function () {
            // Arrange.
            let services = new AccountPageTestServiceLocator();
            let viewModel = services.get(AccountViewModel);
            // Act.
            viewModel.newPassword = '1';
            // Assert.
            let validationResult = viewModel.errors.getError('newPassword');
            strict.equal(validationResult.valid, false);
            strict.equal(validationResult.error, 'New Password must be between 6 and 100 characters but is 1.');
        });
        it('when password too long there is validation error', function () {
            // Arrange.
            let services = new AccountPageTestServiceLocator();
            let viewModel = services.get(AccountViewModel);
            // Act.
            viewModel.newPassword = '1'.repeat(101);
            // Assert.
            let validationResult = viewModel.errors.getError('newPassword');
            strict.equal(validationResult.valid, false);
            strict.equal(validationResult.error, 'New Password must be between 6 and 100 characters but is 101.');
        });
        it('when confirm password does not match there is validation error', function () {
            // Arrange.
            let services = new AccountPageTestServiceLocator();
            let viewModel = services.get(AccountViewModel);
            // Act.
            viewModel.newPassword = '1';
            viewModel.confirmNewPassword = '2';
            // Assert.
            let validationResult = viewModel.errors.getError('confirmNewPassword');
            strict.equal(validationResult.valid, false);
            strict.equal(validationResult.error, 'New Password and Confirm New Password must be the same.');
        });
        it('when new password and confirm password are valid there is not validation errors', function () {
            // Arrange.
            let services = new AccountPageTestServiceLocator();
            let viewModel = services.get(AccountViewModel);
            // Act.
            viewModel.newPassword = '123456';
            viewModel.confirmNewPassword = '123456';
            // Assert.
            let validationResult = viewModel.errors.getError('confirmNewPassword');
            strict.equal(validationResult.valid, true);
        });
    });
    describe('submit command', function () {
        it('can execute when new password and confirm password are valid', function () {
            // Arrange.
            let services = new AccountPageTestServiceLocator();
            let uploadService = services.get(UploadService);
            let actualEvent;
            uploadService.methodCalled.subscribe(event => {
                actualEvent = event;
            });
            let viewModel = services.get(AccountViewModel);
            viewModel.newPassword = '123456';
            viewModel.confirmNewPassword = '123456';
            // Act.
            viewModel.submitCommand.execute();
            // Assert.
            strict.equal(actualEvent.name, 'submitForm');
            let url = actualEvent.args[0];
            let formData = actualEvent.args[1];
            strict.equal(url, '/admin/account?handler=UpdatePassword');
            strict.equal(formData._entries.get('Input.Password')[0], '123456');
            strict.equal(viewModel.submitCommand.canExecute(), true);
        });
        describe('can not execute when validation error', function () {
            let validationErrorTestCases = [
                { name: 'New Password too short', newPassword: '1', confirmNewPassword: '1' },
                { name: 'New Password too long', newPassword: '1'.repeat(101), confirmNewPassword: '1'.repeat(101) },
                { name: 'Confirm New Password does not match', newPassword: '123456', confirmNewPassword: '654321' }
            ];
            for (let validationErrorTestCase of validationErrorTestCases) {
                it(validationErrorTestCase.name, function () {
                    // Arrange.
                    let services = new AccountPageTestServiceLocator();
                    let uploadService = services.get(UploadService);
                    let actualEvent;
                    uploadService.methodCalled.subscribe(event => {
                        actualEvent = event;
                    });
                    let viewModel = services.get(AccountViewModel);
                    viewModel.newPassword = validationErrorTestCase.newPassword;
                    viewModel.confirmNewPassword = validationErrorTestCase.confirmNewPassword;
                    // Act.
                    viewModel.submitCommand.execute();
                    // Assert.
                    strict.equal(actualEvent, undefined);
                    strict.equal(viewModel.submitCommand.canExecute(), false);
                });
            }
        });
        it('empty form gives validation error after submit', function () {
            // Arrange.
            let services = new AccountPageTestServiceLocator();
            let uploadService = services.get(UploadService);
            let actualEvent;
            uploadService.methodCalled.subscribe(event => {
                actualEvent = event;
            });
            let viewModel = services.get(AccountViewModel);
            // Act.
            viewModel.submitCommand.execute();
            // Assert.
            strict.equal(actualEvent, undefined);
            strict.equal(viewModel.submitCommand.canExecute(), false);
            strict.equal(viewModel.errors.hasErrors, true);
        });
    });
});
//# sourceMappingURL=accountViewModel.spec.js.map