import { Result } from "../../ts/utils";
import { ObservableCollection, ObservableKeyArray } from "../../utils/collections/module";
import { BansHubService } from "./bansHubService";
import { Ban } from "./ban";
import { IHiddenInputService } from "../../services/iHiddenInputService";

export class BansService {
    private _bansHubService: BansHubService;

    private _actor = '';
    private _bans = new ObservableKeyArray<string, Ban>(ban => ban.Username);

    get actor(): string {
        return this._actor;
    }

    get bans(): ObservableCollection<Ban> {
        return this._bans;
    }

    constructor(bansHubService: BansHubService, hiddenInputService: IHiddenInputService) {
        this._bansHubService = bansHubService;

        this._actor = hiddenInputService.getValue('__username');

        bansHubService.onSendBans.subscribe(event => {
            this._bans.update(event);
        });

        bansHubService.whenConnection(() => bansHubService.requestBans());
    }

    requestBans(): void {
        this._bansHubService.requestBans();
    }

    addBan(ban: Ban, synchronizeWithServers: boolean): Promise<Result> {
        return this._bansHubService.addBan(ban, synchronizeWithServers);
    }

    removeBan(username: string, synchronizeWithServers: boolean): Promise<Result> {
        return this._bansHubService.removeBan(username, synchronizeWithServers);
    }
}