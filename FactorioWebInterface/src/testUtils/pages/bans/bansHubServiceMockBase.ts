import { InvokeBase } from "../../invokeBase";
import { BansHubService } from "../../../pages/bans/bansHubService";
import { PublicPart } from "../../../utils/types";
import { IObservable, Observable } from "../../../utils/observable";
import { CollectionChangedData, Result } from "../../../ts/utils";
import { Ban } from "../../../pages/bans/ban";

export class BanssHubServiceMockBase extends InvokeBase<BansHubService> implements PublicPart<BansHubService>{
    _onConnection = new Observable<void>();

    _onSendBans = new Observable<CollectionChangedData<Ban>>();

    get onSendBans(): IObservable<CollectionChangedData<Ban>> {
        this.invoked('onSendBans');
        return this._onSendBans;
    }

    whenConnection(callback: () => void): () => void {
        this.invoked('whenConnection', callback);
        return this._onConnection.subscribe(callback);
    }

    requestBans(): void {
        this.invoked('requestBans');
    }

    addBan(ban: Ban, synchronizeWithServers: boolean): Promise<Result> {
        this.invoked('addBan', ban, synchronizeWithServers);
        return Promise.resolve({ Success: true });
    }

    removeBan(username: string, synchronizeWithServers: boolean): Promise<Result> {
        this.invoked('removeBan', username, synchronizeWithServers);
        return Promise.resolve({ Success: true });
    }
}