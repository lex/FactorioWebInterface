import { InvokeBase } from "../../invokeBase";
import { Observable } from "../../../utils/observable";
export class AdminsHubServiceMockBase extends InvokeBase {
    constructor() {
        super(...arguments);
        this._onConnection = new Observable();
        this._onSendAdmins = new Observable();
    }
    get onSendAdmins() {
        this.invoked('onSendAdmins');
        return this._onSendAdmins;
    }
    whenConnection(callback) {
        this.invoked('whenConnection', callback);
        return this._onConnection.subscribe(callback);
    }
    requestAdmins() {
        this.invoked('requestAdmins');
    }
    addAdmins(data) {
        this.invoked('addAdmins', data);
        return Promise.resolve({ Success: true });
    }
    removeAdmins(name) {
        this.invoked('removeAdmins', name);
        return Promise.resolve({ Success: true });
    }
}
//# sourceMappingURL=adminsHubServiceMockBase.js.map