var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as signalR from "@microsoft/signalr";
import { MessagePackHubProtocol } from "@microsoft/signalr-protocol-msgpack";
import { ObservableKeyArray } from "../../utils/observableCollection";
export class AdminsService {
    constructor() {
        this._admins = new ObservableKeyArray(admin => admin.Name);
        this._connection = new signalR.HubConnectionBuilder()
            .withUrl("/factorioAdminHub")
            .withHubProtocol(new MessagePackHubProtocol())
            .build();
        this._connection.on('SendAdmins', (data) => {
            this._admins.update(data);
        });
        this._connection.onclose(() => __awaiter(this, void 0, void 0, function* () {
            yield this.startConnection();
        }));
        this.startConnection();
    }
    get admins() {
        return this._admins;
    }
    requestAdmins() {
        this._connection.send('RequestAdmins');
    }
    addAdmins(text) {
        return __awaiter(this, void 0, void 0, function* () {
            let data = text.trim();
            if (data === "") {
                return 'Enter names for admins';
            }
            let result = yield this._connection.invoke('AddAdmins', data);
            if (!result.Success) {
                return JSON.stringify(result.Errors);
            }
            return undefined;
        });
    }
    removeAdmin(admin) {
        return __awaiter(this, void 0, void 0, function* () {
            let name = admin.Name;
            let result = yield this._connection.invoke('RemoveAdmin', name);
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
                this.requestAdmins();
            }
            catch (ex) {
                console.log(ex);
                setTimeout(() => this.startConnection(), 2000);
            }
        });
    }
}
//# sourceMappingURL=adminsService.js.map