import { ObservableKeyArray } from "../../utils/collections/module";
export class BansService {
    constructor(bansHubService, hiddenInputService) {
        this._actor = '';
        this._bans = new ObservableKeyArray(ban => ban.Username);
        this._bansHubService = bansHubService;
        this._actor = hiddenInputService.getValue('__username');
        bansHubService.onSendBans.subscribe(event => {
            this._bans.update(event);
        });
        bansHubService.whenConnection(() => bansHubService.requestBans());
    }
    get actor() {
        return this._actor;
    }
    get bans() {
        return this._bans;
    }
    requestBans() {
        this._bansHubService.requestBans();
    }
    addBan(ban, synchronizeWithServers) {
        return this._bansHubService.addBan(ban, synchronizeWithServers);
    }
    removeBan(username, synchronizeWithServers) {
        return this.removeBan(username, synchronizeWithServers);
    }
}
//# sourceMappingURL=bansService.js.map