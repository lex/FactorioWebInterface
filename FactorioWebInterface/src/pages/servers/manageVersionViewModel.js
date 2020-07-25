var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { CloseBaseViewModel } from "../../utils/CloseBaseViewModel";
import { DelegateCommand } from "../../utils/command";
import { IterableHelper } from "../../utils/iterableHelper";
import { CollectionChangeType } from "../../ts/utils";
import { ObservableProperty } from "../../utils/observableProperty";
import { FactorioServerStatusUtils } from "./factorioServerStatusUtils";
import { Observable } from "../../utils/observable";
import { CollectionView } from "../../utils/collections/module";
export class ManageVersionViewModel extends CloseBaseViewModel {
    constructor(manageVersionService, status, errorService) {
        super();
        this._isFetchingVersions = new ObservableProperty(true);
        this._subscriptions = [];
        this._manageVersionService = manageVersionService;
        this._status = status;
        this._errorService = errorService;
        this._downloadableVersions = new CollectionView(manageVersionService.downloadableVersions);
        this.updatedSelected();
        manageVersionService.downloadableVersions.subscribe(event => {
            if (event.Type === CollectionChangeType.Reset) {
                this.updatedSelected();
            }
            this._isFetchingVersions.raise(false);
        }, this._subscriptions);
        this._downloadAndUpdateCommand = new DelegateCommand(() => {
            var _a;
            let selected = (_a = IterableHelper.firstOrDefault(this._downloadableVersions.selected)) === null || _a === void 0 ? void 0 : _a.value;
            this.update(selected);
        }, () => {
            if (!FactorioServerStatusUtils.IsUpdatable(this._status.value)) {
                return false;
            }
            let selected = IterableHelper.firstOrDefault(this._downloadableVersions.selected);
            return selected != null;
        });
        this._updateCommand = new DelegateCommand(version => this.update(version), version => FactorioServerStatusUtils.IsUpdatable(this._status.value));
        this._downloadableVersions.selectedChanged.subscribe(() => this._downloadAndUpdateCommand.raiseCanExecuteChanged(), this._subscriptions);
        this._status.subscribe(event => {
            this._downloadAndUpdateCommand.raiseCanExecuteChanged();
            this._updateCommand.raiseCanExecuteChanged();
        }, this._subscriptions);
        manageVersionService.requestDownloadableVersion();
        manageVersionService.requestCachedVersions();
    }
    get downloadableVersions() {
        return this._downloadableVersions;
    }
    get isFetchingVersions() {
        return this._isFetchingVersions;
    }
    get cachedVersions() {
        return this._manageVersionService.cachedVersions;
    }
    get downloadAndUpdateCommand() {
        return this._downloadAndUpdateCommand;
    }
    get updateCommand() {
        return this._updateCommand;
    }
    update(version) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = yield this._manageVersionService.update(version);
            this._errorService.reportIfError(result);
            if (result.Success) {
                this.close();
            }
        });
    }
    delete(version) {
        this._manageVersionService.deleteCachedVersion(version);
    }
    disconnect() {
        Observable.unSubscribeAll(this._subscriptions);
    }
    updatedSelected() {
        if (this._downloadableVersions.selectedCount === 0) {
            this._downloadableVersions.setFirstSingleSelected();
        }
    }
}
//# sourceMappingURL=manageVersionViewModel.js.map