import { ScenarioDataViewModel } from "./scenarioDataViewModel";
import { ScenarioDataPageTestServiceLocator } from "../../testUtils/testServiceLocator";
import { ScenarioDataHubServiceMockBase } from "../../testUtils/pages/scenarioData/scenarioDataHubServiceMockBase";
import { ScenarioDataHubService } from "./scenarioDataHubService";
import { strict } from "assert";
import { ScenarioData, Entry } from "./scenarioData";
import { CollectionChangeType } from "../../ts/utils";

const dataSets: string[] = [
    'ghi',
    'def',
    'abc'
];

const entries: Entry[] = [
    { Key: 'abc key', Value: '1' },
    { Key: 'def key', Value: '2' },
    { Key: 'ghi key', Value: '3' },
];

describe('UpdateDataViewModel', function () {
    it('update command calls update', function () {
        // Arrange.
        let services = new ScenarioDataPageTestServiceLocator();

        let hub: ScenarioDataHubServiceMockBase = services.get(ScenarioDataHubService);
        let actaulDataSet;
        hub.methodCalled.subscribe(event => {
            if (event.name === 'updateData') {
                actaulDataSet = event.args[0];
            }
        })

        let mainViewModel: ScenarioDataViewModel = services.get(ScenarioDataViewModel);

        let dataSet: ScenarioData = {
            DataSet: 'dataSet',
            Key: 'key',
            Value: 'value'
        };

        let viewModel = mainViewModel.updateDataViewModel;
        viewModel.DataSet = dataSet.DataSet;
        viewModel.Key = dataSet.Key;
        viewModel.Value = dataSet.Value;

        // Act.
        viewModel.updateCommand.execute();

        // Assert.
        strict.deepEqual(actaulDataSet, dataSet);
    });

    it('form updates when click on dataSet row', function () {
        // Arrange.        
        let services = new ScenarioDataPageTestServiceLocator();

        let mainViewModel: ScenarioDataViewModel = services.get(ScenarioDataViewModel);
        let dataSetViewModel = mainViewModel.dataSetViewModel;
        let viewModel = mainViewModel.updateDataViewModel;

        let hub: ScenarioDataHubServiceMockBase = services.get(ScenarioDataHubService);
        hub._onSendDataSets.raise({ Type: CollectionChangeType.Reset, NewItems: dataSets });

        let dataSetBox = dataSetViewModel.dataSets.getBoxByKey(dataSets[1]);
        dataSetViewModel.dataSets.setSingleSelected(dataSetBox);

        hub._onSendEntries.raise({ dataSet: dataSets[1], data: { Type: CollectionChangeType.Reset, NewItems: entries } });

        let entry = [...dataSetViewModel.entries.values()][1];

        // Act.
        dataSetViewModel.updateFormFromEntry(entry);

        // Assert.
        strict.equal(viewModel.DataSet, 'def');
        strict.equal(viewModel.Key, 'def key');
        strict.equal(viewModel.Value, '2');
    });
});