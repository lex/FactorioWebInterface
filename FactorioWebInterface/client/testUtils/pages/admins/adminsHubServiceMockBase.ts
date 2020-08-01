import { InvokeBase } from "../../invokeBase";
import { AdminsHubService } from "../../../pages/admins/adminsHubService";
import { PublicPart } from "../../../utils/types";
import { IObservable, Observable } from "../../../utils/observable";
import { CollectionChangedData, Result } from "../../../ts/utils";
import { Admin } from "../../../pages/admins/adminsTypes";

export class AdminsHubServiceMockBase extends InvokeBase<AdminsHubService> implements PublicPart<AdminsHubService>{
    _onConnection = new Observable<void>();

    _onSendAdmins = new Observable<CollectionChangedData<Admin>>();

    get onSendAdmins(): IObservable<CollectionChangedData<Admin>> {
        this.invoked('onSendAdmins');
        return this._onSendAdmins;
    }

    whenConnection(callback: () => void): () => void {
        this.invoked('whenConnection', callback);
        return this._onConnection.subscribe(callback);
    }

    requestAdmins(): void {
        this.invoked('requestAdmins');
    }

    addAdmins(data: string): Promise<Result> {
        this.invoked('addAdmins', data);
        return Promise.resolve({ Success: true });
    }

    removeAdmin(name: string): Promise<Result> {
        this.invoked('removeAdmin', name);
        return Promise.resolve({ Success: true });
    }
}