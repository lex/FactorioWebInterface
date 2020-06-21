var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { CloseBaseViewModel } from "../../utils/CloseBaseViewModel";
import { DelegateCommand } from "../../utils/command";
export class DeleteModPackViewModel extends CloseBaseViewModel {
    constructor(modPack, modsService, errorService) {
        super();
        this._name = '';
        this._modsService = modsService;
        this._errorService = errorService;
        this._name = modPack.Name;
        this._deleteCommand = new DelegateCommand(() => __awaiter(this, void 0, void 0, function* () {
            let result = yield this._modsService.deleteModPack(this._name);
            if (!result.Success) {
                this._errorService.reportIfError(result);
                return;
            }
            this.close();
        }));
        this._cancelCommand = new DelegateCommand(() => this.close());
    }
    get name() {
        return this._name;
    }
    get deleteCommand() {
        return this._deleteCommand;
    }
    get cancelCommand() {
        return this._cancelCommand;
    }
}
//# sourceMappingURL=DeleteModPackViewModel.js.map