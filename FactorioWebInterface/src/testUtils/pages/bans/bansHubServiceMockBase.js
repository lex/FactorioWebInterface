import { InvokeBase } from "../../invokeBase";
import { Observable } from "../../../utils/observable";
export class BansHubServiceMockBase extends InvokeBase {
    constructor() {
        super(...arguments);
        this._onConnection = new Observable();
        this._onSendBans = new Observable();
    }
    get onSendBans() {
        this.invoked('onSendBans');
        return this._onSendBans;
    }
    whenConnection(callback) {
        this.invoked('whenConnection', callback);
        return this._onConnection.subscribe(callback);
    }
    requestBans() {
        this.invoked('requestBans');
    }
    addBan(ban, synchronizeWithServers) {
        this.invoked('addBan', ban, synchronizeWithServers);
        return Promise.resolve({ Success: true });
    }
    removeBan(username, synchronizeWithServers) {
        this.invoked('removeBan', username, synchronizeWithServers);
        return Promise.resolve({ Success: true });
    }
}
//# sourceMappingURL=bansHubServiceMockBase.js.map