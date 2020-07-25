var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { HubConnectionBuilder } from "@microsoft/signalr";
import { MessagePackHubProtocol } from "@microsoft/signalr-protocol-msgpack";
import { ObservableKeyArray } from "../../utils/collections/module";
export class BansService {
    constructor() {
        this._bans = new ObservableKeyArray(ban => ban.Username);
        this._connection = new HubConnectionBuilder()
            .withUrl("/factorioBanHub")
            .withHubProtocol(new MessagePackHubProtocol())
            .build();
        this._connection.on('SendBans', (data) => {
            this._bans.update(data);
        });
        this._connection.onclose(() => __awaiter(this, void 0, void 0, function* () {
            yield this.startConnection();
        }));
        this.startConnection();
    }
    get bans() {
        return this._bans;
    }
    requestBans() {
        this._connection.send('RequestAllBans');
    }
    addBan(ban, synchronizeWithServers) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = yield this._connection.invoke('AddBan', ban, synchronizeWithServers);
            if (!result.Success) {
                return JSON.stringify(result.Errors);
            }
            return undefined;
        });
    }
    removeBan(username, synchronizeWithServers) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = yield this._connection.invoke('RemoveBan', username, synchronizeWithServers);
            if (!result.Success) {
                return JSON.stringify(result.Errors);
            }
            return undefined;
        });
    }
    startConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this._connection.start();
                this.requestBans();
            }
            catch (ex) {
                console.log(ex);
                setTimeout(() => this.startConnection(), 2000);
            }
        });
    }
}
//# sourceMappingURL=bansService.js.map