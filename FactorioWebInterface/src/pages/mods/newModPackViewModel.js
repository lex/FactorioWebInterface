var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { ObservableObjectCloseBaseViewModel } from "../../utils/CloseBaseViewModel";
import { DelegateCommand } from "../../utils/command";
import { ObservableErrors } from "../../utils/observableErrors";
import { Validator, NotEmptyString } from "../../utils/validator";
export class NewModPackViewModel extends ObservableObjectCloseBaseViewModel {
    constructor(modsService, errorService) {
        super();
        this._errors = new ObservableErrors();
        this._name = '';
        this._modsService = modsService;
        this._errorService = errorService;
        this._validator = new Validator(this, [
            new NotEmptyString('name', 'Name')
        ]);
        this._createCommand = new DelegateCommand(() => __awaiter(this, void 0, void 0, function* () {
            if (!this.validateAll()) {
                return;
            }
            let result = yield this._modsService.createModPack(this._name);
            if (!result.Success) {
                this._errorService.reportIfError(result);
                return;
            }
            this.close();
        }));
        this._cancelCommand = new DelegateCommand(() => this.close());
    }
    get errors() {
        return this._errors;
    }
    get name() {
        return this._name;
    }
    set name(value) {
        if (this._name === value) {
            return;
        }
        this._name = value;
        this.raise('name', value);
        this.validateAll();
    }
    get createCommand() {
        return this._createCommand;
    }
    get cancelCommand() {
        return this._cancelCommand;
    }
    validateAll() {
        let validationResult = this._validator.validate('name');
        this.errors.setError('name', validationResult);
        return validationResult.valid;
    }
}
//# sourceMappingURL=newModPackViewModel.js.map