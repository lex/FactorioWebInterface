var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { ObservableKeyArray } from "../../utils/collections/module";
export class AdminsService {
    constructor(adminsHubservice) {
        this._admins = new ObservableKeyArray(admin => admin.Name);
        this._adminsHubservice = adminsHubservice;
        adminsHubservice.onSendAdmins.subscribe(event => {
            this._admins.update(event);
        });
        adminsHubservice.whenConnection(() => {
            adminsHubservice.requestAdmins();
        });
    }
    get admins() {
        return this._admins;
    }
    addAdmins(text) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._adminsHubservice.addAdmins(text);
        });
    }
    removeAdmin(name) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._adminsHubservice.removeAdmins(name);
        });
    }
}
//# sourceMappingURL=adminsService.js.map