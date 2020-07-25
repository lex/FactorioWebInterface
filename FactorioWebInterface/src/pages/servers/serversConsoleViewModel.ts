import { ServerIdService } from "./serverIdService";
import { DelegateCommand, ICommand } from "../../utils/command";
import { ServerConsoleService } from "./serverConsoleService";
import { CollectionChangeType } from "../../ts/utils";
import { FileViewModel } from "./fileViewModel";
import { FileMetaData, ScenarioMetaData, MessageData, FactorioServerStatus } from "./serversTypes";
import { IterableHelper } from "../../utils/iterableHelper";
import { ScenariosViewModel } from "./scenariosViewModel";
import { ErrorService } from "../../services/errorService";
import { ObservableObject } from "../../utils/observableObject";
import { CommandHistory } from "../../utils/commandHistory";
import { FactorioServerStatusUtils } from "./factorioServerStatusUtils";
import { IModalService } from "../../services/iModalService";
import { ManageVersionViewModel } from "./manageVersionViewModel";
import { ManageVersionService } from "./manageVersionService";
import { ServerSettingsService } from "./serverSettingsService";
import { CollectionView, ObservableCollection } from "../../utils/collections/module";

export class ServersConsoleViewModel extends ObservableObject<ServersConsoleViewModel> {
    static readonly resumeTooltipDisabledMessage = 'Can only resume when there is a save in Temp Saves and the server is stopped.';
    static readonly loadTooltipDisabledMessage = 'Can only load when a single save is selected and server is stopped.';
    static readonly startScenarioTooltipDisabledMessage = 'Can only start a scenario when a single scenario is selected and the server is stopped.';
    static readonly saveTooltipEnabledMessage = 'Saves the game, file will be written to Temp Saves/currently_running.zip.';
    static readonly saveTooltipDisabledMessage = 'Can only save when the server is running.';
    static readonly manageVersionTooltipMessage = 'Opens up the Version Manager, use to change the server\'s version.';
    static readonly stopTooltipEnabledMessage = 'Stops the server.';
    static readonly stopTooltipDisabledMessage = 'Can only stop when the server is running.';
    static readonly forceStopTooltipMessage = 'Forcefully stops the server, or any rogue Factorio processes.';

    private readonly _serverIdService: ServerIdService;
    private readonly _serverConsoleService: ServerConsoleService;
    private readonly _manageVersionService: ManageVersionService;
    private readonly _serverSettingsService: ServerSettingsService;
    private readonly _modalService: IModalService;
    private readonly _errorService: ErrorService;

    private readonly _tempFiles: FileViewModel;
    private readonly _localFiles: FileViewModel;
    private readonly _globalFiles: FileViewModel;
    private readonly _scenarios: ScenariosViewModel;

    private _serverIdsCollectionView: CollectionView<string>;

    private _nameText = '';
    private _statusText = '';
    private _versionText = '';
    private _sendText = '';
    private _commandHistory = new CommandHistory();

    private _resumeTooltip: string = null;
    private _loadTooltip: string = null;
    private _startScenarioTooltip: string = null;
    private _saveTooltip: string = null;
    private _stopTooltip: string = null;

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

    get nameText(): string {
        return this._nameText;
    }

    get statusText(): string {
        return this._statusText;
    }

    get versionText(): string {
        return this._versionText;
    }

    get resumeTooltip(): string {
        return this._resumeTooltip;
    }
    set resumeTooltip(value: string) {
        if (value === this._resumeTooltip) {
            return;
        }

        this._resumeTooltip = value;
        this.raise('resumeTooltip', value);
    }

    get loadTooltip(): string {
        return this._loadTooltip;
    }
    set loadTooltip(value: string) {
        if (value === this._loadTooltip) {
            return;
        }

        this._loadTooltip = value;
        this.raise('loadTooltip', value);
    }

    get startScenarioTooltip(): string {
        return this._startScenarioTooltip;
    }
    set startScenarioTooltip(value: string) {
        if (value === this._startScenarioTooltip) {
            return;
        }

        this._startScenarioTooltip = value;
        this.raise('startScenarioTooltip', value);
    }

    get saveTooltip(): string {
        return this._saveTooltip;
    }
    set saveTooltip(value: string) {
        if (value === this._saveTooltip) {
            return;
        }

        this._saveTooltip = value;
        this.raise('saveTooltip', value);
    }

    get manageVersionTooltip(): string {
        return ServersConsoleViewModel.manageVersionTooltipMessage;
    }

    get stopTooltip(): string {
        return this._stopTooltip;
    }
    set stopTooltip(value: string) {
        if (value === this._stopTooltip) {
            return;
        }

        this._stopTooltip = value;
        this.raise('stopTooltip', value);
    }

    get forceStopTooltip(): string {
        return ServersConsoleViewModel.forceStopTooltipMessage;
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
        serverSettingsService: ServerSettingsService,
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
        this._serverSettingsService = serverSettingsService;
        this._modalService = modalService;
        this._errorService = errorService;

        this._tempFiles = tempFiles;
        this._localFiles = localFiles;
        this._globalFiles = globalFiles;
        this._scenarios = scenarios;

        this._serverIdsCollectionView = new CollectionView(this._serverIdService.serverIds);

        this._serverIdsCollectionView.selectedChanged.subscribe(() => {
            let selectedValue = IterableHelper.firstOrDefault(this._serverIdsCollectionView.selected)?.value
            this.setServerId(selectedValue);
        });

        serverIdService.currentServerId.bind(selected => this.updatedSelected(selected));

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
            let vm = new ManageVersionViewModel(this._manageVersionService, this._serverConsoleService.status, this._errorService);
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

        this.updateStatusText(this._serverConsoleService.status.value);
        this.updateResumeTooltip();
        this.updateLoadTooltip();
        this.updateStartScenarioTooltip();
        this.updateSaveTooltip();
        this.updateStopTooltip();

        let selectedSaveFilesChanged = (() => {
            this._loadCommand.raiseCanExecuteChanged();
            this.updateLoadTooltip();
        });
        tempFiles.files.selectedChanged.subscribe(selectedSaveFilesChanged);
        localFiles.files.selectedChanged.subscribe(selectedSaveFilesChanged);
        globalFiles.files.selectedChanged.subscribe(selectedSaveFilesChanged);

        scenarios.scenarios.selectedChanged.subscribe(() => {
            this._startScenarioCommand.raiseCanExecuteChanged();
            this.updateStartScenarioTooltip();
        });

        tempFiles.files.subscribe(() => {
            this._resumeCommand.raiseCanExecuteChanged();
            this.updateResumeTooltip();
        });

        serverConsoleService.status.subscribe(event => {
            this._resumeCommand.raiseCanExecuteChanged();
            this._loadCommand.raiseCanExecuteChanged();
            this._startScenarioCommand.raiseCanExecuteChanged();
            this._saveCommand.raiseCanExecuteChanged();
            this._stopCommand.raiseCanExecuteChanged();

            this.updateStatusText(event)

            this.updateResumeTooltip();
            this.updateLoadTooltip();
            this.updateStartScenarioTooltip();
            this.updateSaveTooltip();
            this.updateStopTooltip();
        });

        serverSettingsService.settingsChanged.subscribe((event) => {
            if (event.Type === CollectionChangeType.Reset) {
                this.updateServerName();
            }
        });
        this.updateServerName();

        serverConsoleService.version.bind(event => this.updateVersionText(event));
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

    private setNameText(value: string) {
        if (value === this._nameText) {
            return;
        }

        this._nameText = value;
        this.raise('nameText', value);
    }

    private setStatusText(value: string) {
        if (value === this._statusText) {
            return;
        }

        this._statusText = value;
        this.raise('statusText', value);
    }

    private setVersionText(value: string) {
        if (value === this._versionText) {
            return;
        }

        this._versionText = value;
        this.raise('versionText', value);
    }

    private updateServerName() {
        let text = `Name: ${this._serverSettingsService.settings?.Name ?? ''}`;
        this.setNameText(text);
    }

    private updateStatusText(value: string) {
        let text = `Status: ${value}`;
        this.setStatusText(text);
    }

    private updateVersionText(value: string) {
        let text = `Version: ${value}`;
        this.setVersionText(text);
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

    private updateResumeTooltip() {
        if (this._resumeCommand.canExecute()) {
            let newFile = IterableHelper.max(this._tempFiles.files.values(), f => f.value.LastModifiedTime);
            this.resumeTooltip = `Start server with latest Temp save: ${newFile.value.Name}.`;
        } else {
            this.resumeTooltip = ServersConsoleViewModel.resumeTooltipDisabledMessage;
        }
    }

    private updateLoadTooltip() {
        if (this._loadCommand.canExecute()) {
            let saveFile = this.getSelectedSaveFile();
            this.loadTooltip = `Start server with selected save: ${FileMetaData.FriendlyDirectoryName(saveFile)}/${saveFile.Name}.`;
        } else {
            this.loadTooltip = ServersConsoleViewModel.loadTooltipDisabledMessage;
        }
    }

    private updateStartScenarioTooltip() {
        if (this._startScenarioCommand.canExecute()) {
            let scenario = this.getSelectedScenario();
            this.startScenarioTooltip = `Start server with selected scenario: ${scenario.Name}.`;
        } else {
            this.startScenarioTooltip = ServersConsoleViewModel.startScenarioTooltipDisabledMessage;
        }
    }

    private updateSaveTooltip() {
        this.saveTooltip = this._saveCommand.canExecute() ? ServersConsoleViewModel.saveTooltipEnabledMessage : ServersConsoleViewModel.saveTooltipDisabledMessage;
    }

    private updateStopTooltip() {
        this.stopTooltip = this._stopCommand.canExecute() ? ServersConsoleViewModel.stopTooltipEnabledMessage : ServersConsoleViewModel.stopTooltipDisabledMessage;
    }
}