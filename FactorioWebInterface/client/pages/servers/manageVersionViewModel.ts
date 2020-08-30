import { ObservableObjectCloseBaseViewModel } from "../../utils/CloseBaseViewModel";
import { DelegateCommand, ICommand } from "../../utils/command";
import { ManageVersionService } from "./manageVersionService";
import { IterableHelper } from "../../utils/iterableHelper";
import { ErrorService } from "../../services/errorService";
import { CollectionChangeType } from "../../ts/utils";
import { ObservableProperty, IObservableProperty } from "../../utils/observableProperty";
import { FactorioServerStatus } from "./serversTypes";
import { FactorioServerStatusUtils } from "./factorioServerStatusUtils";
import { Observable } from "../../utils/observable";
import { CollectionView, ObservableCollection } from "../../utils/collections/module";
import { ComparatorHelper } from "../../utils/comparatorHelper";

export class ManageVersionViewModel extends ObservableObjectCloseBaseViewModel {
    static readonly updateDisabledTooltipMessage = 'Can only update when the server is stopped.';

    private _manageVersionService: ManageVersionService;
    private _status: IObservableProperty<FactorioServerStatus>;
    private _errorService: ErrorService;

    private _downloadableVersions: CollectionView<string, string>;
    private _cachedVersions: CollectionView<string, string>;
    private _isFetchingVersions = new ObservableProperty<boolean>(true);

    private _updateTooltip = null;

    private _downloadAndUpdateCommand: DelegateCommand;
    private _updateCommand: DelegateCommand<string>;
    private _deleteCommand: DelegateCommand<string>;

    private _subscriptions: (() => void)[] = [];

    get downloadableVersions(): CollectionView<string, string> {
        return this._downloadableVersions;
    }

    get cachedVersions(): CollectionView<string, string> {
        return this._cachedVersions;
    }

    get isFetchingVersions(): IObservableProperty<boolean> {
        return this._isFetchingVersions;
    }

    get updateTooltip(): string {
        return this._updateTooltip;
    }
    set updateTooltip(value: string) {
        if (value === this._updateTooltip) {
            return;
        }

        this._updateTooltip = value;
        this.raise('updateTooltip', value);
    }

    get downloadAndUpdateCommand(): ICommand {
        return this._downloadAndUpdateCommand;
    }

    get updateCommand(): ICommand<string> {
        return this._updateCommand;
    }

    get deleteCommand(): ICommand<string> {
        return this._deleteCommand;
    }

    constructor(manageVersionService: ManageVersionService, status: IObservableProperty<FactorioServerStatus>, errorService: ErrorService) {
        super();

        this._manageVersionService = manageVersionService;
        this._status = status;
        this._errorService = errorService;

        this._downloadableVersions = new CollectionView<string, string>(manageVersionService.downloadableVersions);
        this._downloadableVersions.sortBy({ property: null, ascendingComparator: ManageVersionViewModel.downloadableVersionsComparator, ascending: false });
        this.updatedSelected();

        this._cachedVersions = new CollectionView<string, string>(manageVersionService.cachedVersions);
        this._cachedVersions.sortBy({ property: null, ascendingComparator: ComparatorHelper.caseInsensitiveStringComparator, ascending: false });

        manageVersionService.downloadableVersions.subscribe(event => {
            if (event.Type === CollectionChangeType.Reset) {
                this.updatedSelected();
            }

            this._isFetchingVersions.raise(false);
        }, this._subscriptions);

        this._downloadAndUpdateCommand = new DelegateCommand(
            () => {
                let selected = IterableHelper.firstOrDefault(this._downloadableVersions.selected);
                this.update(selected);
            },
            () => {
                if (!FactorioServerStatusUtils.IsUpdatable(this._status.value)) {
                    return false;
                }

                let selected = IterableHelper.firstOrDefault(this._downloadableVersions.selected);
                return selected != null;
            });

        this._updateCommand = new DelegateCommand(version => this.update(version),
            version => FactorioServerStatusUtils.IsUpdatable(this._status.value));

        this._deleteCommand = new DelegateCommand<string>(version => {
            this._manageVersionService.deleteCachedVersion(version);
        });

        this._downloadableVersions.selectedChanged.subscribe(() => this._downloadAndUpdateCommand.raiseCanExecuteChanged(), this._subscriptions);

        this._status.subscribe(event => {
            this._downloadAndUpdateCommand.raiseCanExecuteChanged();
            this._updateCommand.raiseCanExecuteChanged();
        }, this._subscriptions);

        this._status.bind(() => this.updateUpdateTooltip(), this._subscriptions);

        manageVersionService.requestDownloadableVersion();
        manageVersionService.requestCachedVersions();
    }

    disconnect() {
        Observable.unSubscribeAll(this._subscriptions);
    }

    private async update(version: string): Promise<void> {
        let result = await this._manageVersionService.update(version);
        this._errorService.reportIfError(result);

        if (result.Success) {
            this.close();
        }
    }

    private updatedSelected() {
        if (this._downloadableVersions.selectedCount === 0) {
            this._downloadableVersions.setFirstSingleSelected();
        }
    }

    private updateUpdateTooltip() {
        if (FactorioServerStatusUtils.IsUpdatable(this._status.value)) {
            this.updateTooltip = null;
        } else {
            this.updateTooltip = ManageVersionViewModel.updateDisabledTooltipMessage;
        }
    }

    private static downloadableVersionsComparator(a: string, b: string): number {
        if (a === b) {
            return 0;
        }

        if (a === ManageVersionService.latestVersion) {
            return -1;
        }

        if (b === ManageVersionService.latestVersion) {
            return 1;
        }

        return ComparatorHelper.caseInsensitiveStringComparator(a, b);
    }
}