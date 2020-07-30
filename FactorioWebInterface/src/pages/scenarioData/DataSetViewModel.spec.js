import { ScenarioDataPageTestServiceLocator } from "../../testUtils/testServiceLocator";
import { ScenarioDataHubService } from "./scenarioDataHubService";
import { ScenarioDataViewModel } from "./scenarioDataViewModel";
import { CollectionChangeType } from "../../ts/utils";
import { strict } from "assert";
import { IterableHelper } from "../../utils/iterableHelper";
const dataSets = [
    'ghi',
    'def',
    'abc'
];
const entries = [
    { Key: 'abc key', Value: '1' },
    { Key: 'def key', Value: '2' },
    { Key: 'ghi key', Value: '3' },
];
describe('DataSetViewModel', function () {
    describe('DataSets', function () {
        it('requests when first loading', function () {
            // Arrange.
            let services = new ScenarioDataPageTestServiceLocator();
            let hub = services.get(ScenarioDataHubService);
            hub.methodCalled.subscribe(event => {
                if (event.name === 'whenConnection') {
                    const callback = event.args[0];
                    callback();
                }
            });
            // Act.
            let mainViewModel = services.get(ScenarioDataViewModel);
            let viewModel = mainViewModel.dataSetViewModel;
            // Assert.
            hub.assertMethodCalled('requestAllDataSets');
            strict.equal(true, viewModel.fetchingDataSets);
        });
        it('requests when hub connection starts', function () {
            // Arrange.
            let services = new ScenarioDataPageTestServiceLocator();
            let mainViewModel = services.get(ScenarioDataViewModel);
            let viewModel = mainViewModel.dataSetViewModel;
            let hub = services.get(ScenarioDataHubService);
            // Act.
            hub._onConnection.raise();
            // Assert.
            hub.assertMethodCalled('requestAllDataSets');
            strict.equal(true, viewModel.fetchingDataSets);
        });
        it('collection updates onSendDataSets', function () {
            // Arrange.
            let services = new ScenarioDataPageTestServiceLocator();
            let mainViewModel = services.get(ScenarioDataViewModel);
            let viewModel = mainViewModel.dataSetViewModel;
            let hub = services.get(ScenarioDataHubService);
            // Act.
            hub._onSendDataSets.raise({ Type: CollectionChangeType.Reset, NewItems: dataSets });
            // Assert.
            let actual = IterableHelper.map(viewModel.dataSets.values(), d => d.value);
            // should be sorted by string case insensitive.
            strict.deepEqual([...actual], ['abc', 'def', 'ghi']);
        });
        it('fetchingDatasets set to false onSendDataSets', function () {
            // Arrange.
            let services = new ScenarioDataPageTestServiceLocator();
            let mainViewModel = services.get(ScenarioDataViewModel);
            let viewModel = mainViewModel.dataSetViewModel;
            let hub = services.get(ScenarioDataHubService);
            hub._onConnection.raise();
            strict.equal(true, viewModel.fetchingDataSets);
            // Act.
            hub._onSendDataSets.raise({ Type: CollectionChangeType.Reset, NewItems: dataSets });
            // Assert.
            strict.equal(false, viewModel.fetchingDataSets);
        });
    });
    describe('Entries', function () {
        it('requests when hub connection starts', function () {
            // Arrange.
            let services = new ScenarioDataPageTestServiceLocator();
            let mainViewModel = services.get(ScenarioDataViewModel);
            let viewModel = mainViewModel.dataSetViewModel;
            let hub = services.get(ScenarioDataHubService);
            hub._onSendDataSets.raise({ Type: CollectionChangeType.Reset, NewItems: dataSets });
            let dataSetBox = viewModel.dataSets.getBoxByKey(dataSets[1]);
            viewModel.dataSets.setSingleSelected(dataSetBox);
            // Act.
            hub._onConnection.raise();
            // Assert.
            hub.assertMethodCalled('trackDataSet');
            hub.assertMethodCalled('requestAllDataForDataSet');
            strict.equal('def (fetching...)', viewModel.header);
        });
        it('fetching dataSet set selecting dataSet', function () {
            // Arrange.
            let services = new ScenarioDataPageTestServiceLocator();
            let mainViewModel = services.get(ScenarioDataViewModel);
            let viewModel = mainViewModel.dataSetViewModel;
            let hub = services.get(ScenarioDataHubService);
            hub._onSendDataSets.raise({ Type: CollectionChangeType.Reset, NewItems: dataSets });
            let dataSetBox = viewModel.dataSets.getBoxByKey(dataSets[1]);
            // Act.
            viewModel.dataSets.setSingleSelected(dataSetBox);
            // Assert.
            strict.equal('def (fetching...)', viewModel.header);
        });
        it('removing fetching dataSet when entries sent', function () {
            // Arrange.
            let services = new ScenarioDataPageTestServiceLocator();
            let mainViewModel = services.get(ScenarioDataViewModel);
            let viewModel = mainViewModel.dataSetViewModel;
            let hub = services.get(ScenarioDataHubService);
            hub._onSendDataSets.raise({ Type: CollectionChangeType.Reset, NewItems: dataSets });
            let dataSetBox = viewModel.dataSets.getBoxByKey(dataSets[1]);
            viewModel.dataSets.setSingleSelected(dataSetBox);
            strict.equal('def (fetching...)', viewModel.header);
            // Act.
            hub._onSendEntries.raise({ dataSet: dataSets[1], data: { Type: CollectionChangeType.Reset, NewItems: entries } });
            // Assert.
            strict.equal('def (3)', viewModel.header);
        });
        it('collection updates onSendEntries', function () {
            // Arrange.
            let services = new ScenarioDataPageTestServiceLocator();
            let mainViewModel = services.get(ScenarioDataViewModel);
            let viewModel = mainViewModel.dataSetViewModel;
            let hub = services.get(ScenarioDataHubService);
            hub._onSendDataSets.raise({ Type: CollectionChangeType.Reset, NewItems: dataSets });
            let dataSetBox = viewModel.dataSets.getBoxByKey(dataSets[1]);
            viewModel.dataSets.setSingleSelected(dataSetBox);
            // Act.
            hub._onSendEntries.raise({ dataSet: dataSets[1], data: { Type: CollectionChangeType.Reset, NewItems: entries } });
            // Assert.
            let actual = viewModel.entries;
            // should be sorted by string case insensitive.
            strict.deepEqual([...actual], entries);
            // header set.
            strict.equal('def (3)', viewModel.header);
        });
        it('collection does not updates onSendEntries for wrong dataset', function () {
            // Arrange.
            let services = new ScenarioDataPageTestServiceLocator();
            let mainViewModel = services.get(ScenarioDataViewModel);
            let viewModel = mainViewModel.dataSetViewModel;
            let hub = services.get(ScenarioDataHubService);
            hub._onSendDataSets.raise({ Type: CollectionChangeType.Reset, NewItems: dataSets });
            let dataSetBox = viewModel.dataSets.getBoxByKey(dataSets[0]);
            viewModel.dataSets.setSingleSelected(dataSetBox);
            // Act.
            hub._onSendEntries.raise({ dataSet: dataSets[1], data: { Type: CollectionChangeType.Reset, NewItems: entries } });
            // Assert.
            let actual = viewModel.entries;
            // should be sorted by string case insensitive.
            strict.deepEqual([...actual], []);
        });
    });
    it('refresh dataSet command request dataSets', function () {
        // Arrange.
        let services = new ScenarioDataPageTestServiceLocator();
        let mainViewModel = services.get(ScenarioDataViewModel);
        let viewModel = mainViewModel.dataSetViewModel;
        let hub = services.get(ScenarioDataHubService);
        // Act.
        viewModel.refreshDataSetsCommand.execute();
        // Assert.
        hub.assertMethodCalled('requestAllDataSets');
        strict.equal(true, viewModel.fetchingDataSets);
    });
});
//# sourceMappingURL=DataSetViewModel.spec.js.map