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
import { ObservableErrors } from "../../utils/observableErrors";
import { DelegateCommand } from "../../utils/command";
import { Observable } from "../../utils/observable";
import { Validator, PropertyValidation } from "../../utils/validation/module";
import { ModPackNameNotTakenValidationRule } from "./modPackNameNotTakenValidationRule";
export class RenameModPackViewModel extends ObservableObjectCloseBaseViewModel {
    constructor(modPack, modsService, errorService) {
        super();
        this._subscriptions = [];
        this._errors = new ObservableErrors();
        this._name = '';
        this._modsService = modsService;
        this._errorService = errorService;
        this._modPack = modPack;
        this._name = modPack.Name;
        this._validator = new Validator(this, [
            new PropertyValidation('name')
                .displayName('New Name')
                .notEmptyString()
                .noWhitespaceString()
                .rules(new ModPackNameNotTakenValidationRule(modsService.modPacks))
        ]);
        this._renameCommand = new DelegateCommand(() => __awaiter(this, void 0, void 0, function* () {
            if (!this.validateAll()) {
                return;
            }
            let result = yield this._modsService.renameModPack(this._modPack.Name, this._name);
            if (!result.Success) {
                this._errorService.reportIfError(result);
                return;
            }
            this.close();
        }));
        this._cancelCommand = new DelegateCommand(() => this.close());
        modsService.modPacks.subscribe(() => this.validateAll(), this._subscriptions);
    }
    get errors() {
        return this._errors;
    }
    get name() {
        return this._name;
    }
    set name(value) {
        value = value.trim();
        if (this._name === value) {
            this.raise('name', value);
            return;
        }
        this._name = value;
        this.raise('name', value);
        this.validateAll();
    }
    get renameCommand() {
        return this._renameCommand;
    }
    get cancelCommand() {
        return this._cancelCommand;
    }
    disconnect() {
        Observable.unSubscribeAll(this._subscriptions);
    }
    validateAll() {
        let validationResult = this._validator.validate('name');
        this.errors.setError('name', validationResult);
        return validationResult.valid;
    }
}
//# sourceMappingURL=renameModPackViewModel.js.map