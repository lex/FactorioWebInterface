var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { HubConnectionBuilder, HubConnectionState } from "@microsoft/signalr";
import { MessagePackHubProtocol } from "@microsoft/signalr-protocol-msgpack";
import { Observable } from "../../utils/observable";
export class AdminsHubService {
    constructor() {
        this._whenConnection = new Observable();
        this._onSendAdmins = new Observable();
        this._connection = new HubConnectionBuilder()
            .withUrl("/factorioAdminHub")
            .withHubProtocol(new MessagePackHubProtocol())
            .build();
        this._connection.on('SendAdmins', (data) => {
            this._onSendAdmins.raise(data);
        });
        this._connection.onclose(() => __awaiter(this, void 0, void 0, function* () {
            yield this.startConnection();
        }));
        this.startConnection();
    }
    get onSendAdmins() {
        return this._onSendAdmins;
    }
    whenConnection(callback) {
        if (this._connection.state === HubConnectionState.Connected) {
            callback();
        }
        return this._whenConnection.subscribe(callback);
    }
    requestAdmins() {
        this._connection.send('RequestAdmins');
    }
    addAdmins(data) {
        return this._connection.invoke('AddAdmins', data);
    }
    removeAdmins(name) {
        return this._connection.invoke('RemoveAdmin', name);
    }
    startConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this._connection.start();
                this._whenConnection.raise();
            }
            catch (ex) {
                console.log(ex);
                setTimeout(() => this.startConnection(), 2000);
            }
        });
    }
}
//# sourceMappingURL=adminsHubService.js.map