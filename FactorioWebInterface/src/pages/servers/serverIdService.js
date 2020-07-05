var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { ObservableProperty } from "../../utils/observableProperty";
import { Observable } from "../../utils/observable";
import { ObservableKeyArray } from "../../utils/observableCollection";
export class ServerIdService {
    constructor(serversHubService, hiddenInputService, navigationHistory) {
        this._clientData = new Observable();
        this._serversHubService = serversHubService;
        this._navigationHistory = navigationHistory;
        let selected = hiddenInputService.getValue('serverSelected');
        let count = Number(hiddenInputService.getValue('serverCount'));
        this._currentServerId = new ObservableProperty(selected);
        this._serverIds = new ObservableKeyArray(x => x);
        for (let i = 1; i <= count; i++) {
            this._serverIds.add(i + '');
        }
        navigationHistory.replace(`/admin/servers/${selected}`, selected);
        navigationHistory.onPop.subscribe(event => {
            let value = event.state;
            if (typeof value !== 'string' || value === '' || value === this.currentServerIdValue) {
                return;
            }
            this.updateServerId(value);
            this._currentServerId.raise(value);
        });
        serversHubService.whenConnection(() => {
            this.updateServerId(this.currentServerIdValue);
        });
    }
    get currentServerId() {
        return this._currentServerId;
    }
    get currentServerIdValue() {
        return this._currentServerId.value;
    }
    get serverIds() {
        return this._serverIds;
    }
    get onClientData() {
        return this._clientData;
    }
    setServerId(value) {
        if (this.currentServerIdValue === value) {
            return;
        }
        let promise = this.updateServerId(value);
        this._navigationHistory.push(`/admin/servers/${value}`, value);
        this._currentServerId.raise(value);
        return promise;
    }
    updateServerId(value) {
        return __awaiter(this, void 0, void 0, function* () {
            let data = yield this._serversHubService.setServerId(value);
            this._clientData.raise(data);
        });
    }
}
//# sourceMappingURL=serverIdService.js.map