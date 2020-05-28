var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { ObservableKeyArray } from "../../utils/observableCollection";
import { DelegateCommand } from "../../utils/command";
import { FactorioServerStatus } from "./serversTypes";
import { IterableHelper } from "../../utils/iterableHelper";
import { CollectionView } from "../../utils/collectionView";
import { ObservableObject } from "../../utils/observableObject";
import { CommandHistory } from "../../utils/commandHistory";
import { FactorioServerStatusUtils } from "./factorioServerStatusUtils";
export class ServersConsoleViewModel extends ObservableObject {
    constructor(serverIdService, serverConsoleService, errorService, tempFiles, localFiles, globalFiles, scenarios) {
        super();
        this._sendText = '';
        this._commandHistory = new CommandHistory();
        this._serverIdService = serverIdService;
        this._serverConsoleService = serverConsoleService;
        this._errorService = errorService;
        this._tempFiles = tempFiles;
        this._localFiles = localFiles;
        this._globalFiles = globalFiles;
        this._scenarios = scenarios;
        this._serverIds = new ObservableKeyArray(x => x);
        for (let i = 1; i <= 10; i++) {
            this._serverIds.add(i + '');
        }
        this._serverIdsCollectionView = new CollectionView(this._serverIds);
        this._serverIdsCollectionView.selectedChanged.subscribe(() => {
            var _a;
            let selectedValue = (_a = IterableHelper.firstOrDefault(this._serverIdsCollectionView.selected)) === null || _a === void 0 ? void 0 : _a.value;
            this.setServerId(selectedValue);
        });
        serverIdService.serverId.subscribe(selected => this.updatedSelected(selected));
        this.updatedSelected(serverIdService.serverId.value);
        this._resumeCommand = new DelegateCommand(() => __awaiter(this, void 0, void 0, function* () {
            let result = yield this._serverConsoleService.resume();
            this._errorService.reportIfError(result);
        }), () => this._tempFiles.count > 0 && FactorioServerStatusUtils.isStartable(this._serverConsoleService.status.value));
        this._loadCommand = new DelegateCommand(() => __awaiter(this, void 0, void 0, function* () {
            let file = this.getSelectedSaveFile();
            let result = yield this._serverConsoleService.load(file.Directory, file.Name);
            this._errorService.reportIfError(result);
        }), () => this.getSaveFileSelectedCount() === 1 && FactorioServerStatusUtils.isStartable(this._serverConsoleService.status.value));
        this._startScenarioCommand = new DelegateCommand(() => __awaiter(this, void 0, void 0, function* () {
            let scenario = this.getSelectedScenario();
            let result = yield this._serverConsoleService.startScenario(scenario.Name);
            this._errorService.reportIfError(result);
        }), () => this.getScenarioSelectedCount() === 1 && FactorioServerStatusUtils.isStartable(this._serverConsoleService.status.value));
        this._saveCommand = new DelegateCommand(() => __awaiter(this, void 0, void 0, function* () {
            let result = yield this._serverConsoleService.save();
            this._errorService.reportIfError(result);
        }), () => this._serverConsoleService.status.value === FactorioServerStatus.Running);
        this._stopCommand = new DelegateCommand(() => __awaiter(this, void 0, void 0, function* () {
            let result = yield this._serverConsoleService.stop();
            this._errorService.reportIfError(result);
        }), () => FactorioServerStatusUtils.IsStoppable(this._serverConsoleService.status.value));
        this._forceStopCommand = new DelegateCommand(() => __awaiter(this, void 0, void 0, function* () {
            let result = yield this._serverConsoleService.forceStop();
            this._errorService.reportIfError(result);
        }));
        this._sendCommand = new DelegateCommand(() => {
            let text = this.sendText;
            if (text === '') {
                this._commandHistory.resetIndex();
                return;
            }
            this._serverConsoleService.sendMessage(this._sendText);
            this._commandHistory.write(text);
            this.sendText = '';
        });
        let selectedSaveFilesChanged = () => this._loadCommand.raiseCanExecuteChanged();
        tempFiles.files.selectedChanged.subscribe(selectedSaveFilesChanged);
        localFiles.files.selectedChanged.subscribe(selectedSaveFilesChanged);
        globalFiles.files.selectedChanged.subscribe(selectedSaveFilesChanged);
        scenarios.scenarios.selectedChanged.subscribe(() => this._startScenarioCommand.raiseCanExecuteChanged());
        tempFiles.files.subscribe(() => this._resumeCommand.raiseCanExecuteChanged());
        serverConsoleService.status.subscribe(event => {
            this._resumeCommand.raiseCanExecuteChanged();
            this._loadCommand.raiseCanExecuteChanged();
            this._startScenarioCommand.raiseCanExecuteChanged();
            this._saveCommand.raiseCanExecuteChanged();
            this._stopCommand.raiseCanExecuteChanged();
            //this._forceStopCommand.raiseCanExecuteChanged();
        });
    }
    get serverIds() {
        return this._serverIdsCollectionView;
    }
    get status() {
        return this._serverConsoleService.status;
    }
    get version() {
        return this._serverConsoleService.version;
    }
    get resumeCommand() {
        return this._resumeCommand;
    }
    get loadCommand() {
        return this._loadCommand;
    }
    get startScenarioCommand() {
        return this._startScenarioCommand;
    }
    get saveCommand() {
        return this._saveCommand;
    }
    get stopCommand() {
        return this._stopCommand;
    }
    get forceStopCommand() {
        return this._forceStopCommand;
    }
    get sendCommand() {
        return this._sendCommand;
    }
    get messages() {
        return this._serverConsoleService.messages;
    }
    get sendText() {
        return this._sendText;
    }
    set sendText(value) {
        if (this._sendText === value) {
            return;
        }
        this._sendText = value;
        super.raise('sendText', value);
    }
    sendInputKey(key) {
        var _a, _b;
        if (key === 13) { // enter
            this._sendCommand.execute();
        }
        else if (key === 38) { // up
            this.sendText = (_a = this._commandHistory.movePrev()) !== null && _a !== void 0 ? _a : this.sendText;
        }
        else if (key === 40) { // down
            this.sendText = (_b = this._commandHistory.moveNext()) !== null && _b !== void 0 ? _b : this.sendText;
        }
        else if (key === 27) { // escape
            this._commandHistory.resetIndex();
            this.sendText = '';
        }
    }
    updatedSelected(selected) {
        let box = this._serverIdsCollectionView.getBoxByKey(selected);
        this._serverIdsCollectionView.setSingleSelected(box);
    }
    setServerId(serverId) {
        this._serverIdService.setServerId(serverId);
    }
    getSaveFileSelectedCount() {
        return this._tempFiles.files.selectedCount +
            this._localFiles.files.selectedCount +
            this._globalFiles.files.selectedCount;
    }
    getSelectedSaveFile() {
        var _a, _b;
        return ((_b = (_a = IterableHelper.firstOrDefault(this._tempFiles.files.selected)) !== null && _a !== void 0 ? _a : IterableHelper.firstOrDefault(this._localFiles.files.selected)) !== null && _b !== void 0 ? _b : IterableHelper.firstOrDefault(this._globalFiles.files.selected)).value;
    }
    getScenarioSelectedCount() {
        return this._scenarios.scenarios.selectedCount;
    }
    getSelectedScenario() {
        return IterableHelper.firstOrDefault(this._scenarios.scenarios.selected).value;
    }
}
//# sourceMappingURL=serversConsoleViewModel.js.map