import { Result } from "../../ts/utils";
import { ObservableKeyArray, ObservableCollection } from "../../utils/collections/module";
import { Admin } from "./adminsTypes";
import { AdminsHubService } from "./adminsHubService";

export class AdminsService {
    private _adminsHubservice: AdminsHubService;

    private _admins = new ObservableKeyArray<string, Admin>(admin => admin.Name);

    get admins(): ObservableCollection<Admin> {
        return this._admins;
    }

    constructor(adminsHubservice: AdminsHubService) {
        this._adminsHubservice = adminsHubservice;

        adminsHubservice.onSendAdmins.subscribe(event => {
            this._admins.update(event);
        })

        adminsHubservice.whenConnection(() => {
            adminsHubservice.requestAdmins();
        });
    }

    async addAdmins(text: string): Promise<Result> {
        return this._adminsHubservice.addAdmins(text);
    }

    async removeAdmin(name: string): Promise<Result> {
        return this._adminsHubservice.removeAdmins(name);
    }
}