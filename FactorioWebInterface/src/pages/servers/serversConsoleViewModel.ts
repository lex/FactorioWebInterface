﻿import { ObservableKeyArray, ObservableCollection } from "../../utils/observableCollection";
import { ServerIdService } from "./serverIdService";
import { DelegateCommand, ICommand } from "../../utils/command";
import { ServerConsoleService } from "./serverConsoleService";
import { Result } from "../../ts/utils";
import { FileViewModel } from "./fileViewModel";
import { FileMetaData, ScenarioMetaData, MessageData, FactorioServerStatus } from "./serversTypes";
import { IterableHelper } from "../../utils/iterableHelper";
import { ScenariosViewModel } from "./scenariosViewModel";
import { ErrorService } from "../../services/errorService";
import { CollectionView } from "../../utils/collectionView";
import { ObservableObject } from "../../utils/observableObject";
import { CommandHistory } from "../../utils/commandHistory";
import { IObservableProperty } from "../../utils/observableProperty";
import { FactorioServerStatusUtils } from "./factorioServerStatusUtils";
import { IModalService } from "../../services/iModalService";
import { ManageVersionViewModel } from "./manageVersionViewModel";
import { ManageVersionService } from "./manageVersionService";

export class ServersConsoleViewModel extends ObservableObject {
    private _serverIdService: ServerIdService;
    private _serverConsoleService: ServerConsoleService;
    private _manageVersionService: ManageVersionService;
    private _modalService: IModalService;
    private _errorService: ErrorService;

    private _tempFiles: FileViewModel;
    private _localFiles: FileViewModel;
    private _globalFiles: FileViewModel;
    private _scenarios: ScenariosViewModel;

    private _serverIds: ObservableKeyArray<string, string>;
    private _serverIdsCollectionView: CollectionView<string>;

    private _sendText = '';
    private _commandHistory = new CommandHistory();

    private _resumeCommand: DelegateCommand;
    private _loadCommand: DelegateCommand;
    private _startScenarioCommand: DelegateCommand;
    private _saveCommand: DelegateCommand;
    private _stopCommand: DelegateCommand;
    private _forceStopCommand: DelegateCommand;
    private _manageVersionCommand: DelegateCommand;
    private _sendCommand: DelegateCommand;

    get serverIds(): CollectionView<string> {
        return this._serverIdsCollectionView;
    }

    get status(): IObservableProperty<FactorioServerStatus> {
        return this._serverConsoleService.status;
    }

    get version(): IObservableProperty<string> {
        return this._serverConsoleService.version;
    }

    get resumeCommand(): ICommand {
        return this._resumeCommand;
    }

    get loadCommand(): ICommand {
        return this._loadCommand;
    }

    get startScenarioCommand(): ICommand {
        return this._startScenarioCommand;
    }

    get saveCommand(): ICommand {
        return this._saveCommand;
    }

    get stopCommand(): ICommand {
        return this._stopCommand;
    }

    get forceStopCommand(): ICommand {
        return this._forceStopCommand;
    }

    get manageVersionCommand(): ICommand {
        return this._manageVersionCommand;
    }

    get sendCommand(): ICommand {
        return this._sendCommand;
    }

    get messages(): ObservableCollection<MessageData> {
        return this._serverConsoleService.messages;
    }

    get sendText(): string {
        return this._sendText;
    }

    set sendText(value: string) {
        if (this._sendText === value) {
            return;
        }

        this._sendText = value;
        super.raise('sendText', value);
    }

    constructor(
        serverIdService: ServerIdService,
        serverConsoleService: ServerConsoleService,
        manageVersionService: ManageVersionService,
        modalService: IModalService,
        errorService: ErrorService,
        tempFiles: FileViewModel,
        localFiles: FileViewModel,
        globalFiles: FileViewModel,
        scenarios: ScenariosViewModel
    ) {
        super();

        this._serverIdService = serverIdService;
        this._serverConsoleService = serverConsoleService;
        this._manageVersionService = manageVersionService;
        this._modalService = modalService;
        this._errorService = errorService;

        this._tempFiles = tempFiles;
        this._localFiles = localFiles;
        this._globalFiles = globalFiles;
        this._scenarios = scenarios;

        this._serverIds = new ObservableKeyArray<string, string>(x => x);
        for (let i = 1; i <= 10; i++) {
            this._serverIds.add(i + '');
        }

        this._serverIdsCollectionView = new CollectionView(this._serverIds);

        this._serverIdsCollectionView.selectedChanged.subscribe(() => {
            let selectedValue = IterableHelper.firstOrDefault(this._serverIdsCollectionView.selected)?.value
            this.setServerId(selectedValue);
        });

        serverIdService.serverId.subscribe(selected => this.updatedSelected(selected));
        this.updatedSelected(serverIdService.serverId.value);

        this._resumeCommand = new DelegateCommand(async () => {
            let result = await this._serverConsoleService.resume();
            this._errorService.reportIfError(result);
        },
            () => this._tempFiles.count > 0 && FactorioServerStatusUtils.isStartable(this._serverConsoleService.status.value));

        this._loadCommand = new DelegateCommand(async () => {
            let file = this.getSelectedSaveFile();

            let result = await this._serverConsoleService.load(file.Directory, file.Name);
            this._errorService.reportIfError(result);
        },
            () => this.getSaveFileSelectedCount() === 1 && FactorioServerStatusUtils.isStartable(this._serverConsoleService.status.value));

        this._startScenarioCommand = new DelegateCommand(async () => {
            let scenario = this.getSelectedScenario();

            let result = await this._serverConsoleService.startScenario(scenario.Name);
            this._errorService.reportIfError(result);
        },
            () => this.getScenarioSelectedCount() === 1 && FactorioServerStatusUtils.isStartable(this._serverConsoleService.status.value));

        this._saveCommand = new DelegateCommand(async () => {
            let result = await this._serverConsoleService.save();
            this._errorService.reportIfError(result);
        },
            () => this._serverConsoleService.status.value === FactorioServerStatus.Running);

        this._stopCommand = new DelegateCommand(async () => {
            let result = await this._serverConsoleService.stop();
            this._errorService.reportIfError(result);
        },
            () => FactorioServerStatusUtils.IsStoppable(this._serverConsoleService.status.value));

        this._forceStopCommand = new DelegateCommand(async () => {
            let result = await this._serverConsoleService.forceStop();
            this._errorService.reportIfError(result);
        });

        this._manageVersionCommand = new DelegateCommand(async () => {
            let vm = new ManageVersionViewModel(this._manageVersionService, this.status, this._errorService);
            await this._modalService.showViewModel(vm);

            vm.disconnect();
        });

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

    sendInputKey(key: number) {
        if (key === 13) { // enter
            this._sendCommand.execute();
        } else if (key === 38) { // up
            this.sendText = this._commandHistory.movePrev() ?? this.sendText;
        } else if (key === 40) { // down
            this.sendText = this._commandHistory.moveNext() ?? this.sendText;
        } else if (key === 27) { // escape
            this._commandHistory.resetIndex();
            this.sendText = '';
        }
    }

    private updatedSelected(selected: string) {
        let box = this._serverIdsCollectionView.getBoxByKey(selected);
        this._serverIdsCollectionView.setSingleSelected(box);
    }

    private setServerId(serverId: string) {
        this._serverIdService.setServerId(serverId);
    }

    private getSaveFileSelectedCount(): number {
        return this._tempFiles.files.selectedCount +
            this._localFiles.files.selectedCount +
            this._globalFiles.files.selectedCount;
    }

    private getSelectedSaveFile(): FileMetaData {
        return (IterableHelper.firstOrDefault(this._tempFiles.files.selected) ??
            IterableHelper.firstOrDefault(this._localFiles.files.selected) ??
            IterableHelper.firstOrDefault(this._globalFiles.files.selected)).value;
    }

    private getScenarioSelectedCount(): number {
        return this._scenarios.scenarios.selectedCount;
    }

    private getSelectedScenario(): ScenarioMetaData {
        return IterableHelper.firstOrDefault(this._scenarios.scenarios.selected).value;
    }
}