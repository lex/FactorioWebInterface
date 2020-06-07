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
export class ServerIdService {
    constructor(serversHubService) {
        this._serverId = new ObservableProperty('1');
        this._clientData = new Observable();
        this._serversHubService = serversHubService;
        serversHubService.whenConnection(() => {
            this.updateServerId(this.currentServerId);
        });
    }
    get serverId() {
        return this._serverId;
    }
    get currentServerId() {
        return this._serverId.value;
    }
    get onClientData() {
        return this._clientData;
    }
    setServerId(value) {
        if (this.currentServerId === value) {
            return;
        }
        let promise = this.updateServerId(value);
        this._serverId.raise(value);
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