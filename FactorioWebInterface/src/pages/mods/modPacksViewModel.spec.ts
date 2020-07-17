import { strict } from "assert";
import { ModsPageTestServiceLocator } from "../../testUtils/testServiceLocator";
import { IModalService } from "../../services/iModalService";
import { ModalServiceMockBase } from "../../testUtils/services/modalServiceMockBase";
import { NewModPackViewModel } from "./newModPackViewModel";
import { RenameModPackViewModel } from "./renameModPackViewModel";
import { DeleteModPackViewModel } from "./DeleteModPackViewModel";
import { ModsViewModel } from "./modsViewModel";
import { ModPackMetaData } from "../servers/serversTypes";

const modPack: ModPackMetaData = {
    Name: 'name',
    CreatedTime: '2020-01-01 00:00:00',
    LastModifiedTime: '2020-01-01 00:00:00'
};

describe('ModPacksViewModel', function () {
    let showsModalTestCases = [
        { name: 'new command', command: 'newCommand', arg: undefined, viewModelType: NewModPackViewModel },
        { name: 'rename command', command: 'renameCommand', arg: modPack, viewModelType: RenameModPackViewModel },
        { name: 'delete command', command: 'deleteCommand', arg: modPack, viewModelType: DeleteModPackViewModel },
    ];

    for (let testCase of showsModalTestCases) {
        it(`${testCase.name} shows modal`, function () {
            // Arrange.
            let services = new ModsPageTestServiceLocator();

            let modalService: ModalServiceMockBase = services.get(IModalService);
            let mainViewModel: ModsViewModel = services.get(ModsViewModel);
            let viewModel = mainViewModel.modPacksViewModel;

            // Act.
            viewModel[testCase.command].execute(testCase.arg);

            // Assert.
            let method = modalService.methodsCalled[0];
            strict.equal(method.name, 'showViewModel');
            strict.equal(method.args[0] instanceof testCase.viewModelType, true)
        });
    }
});