import { ModsService } from "./modsService";
import { ErrorService } from "../../services/errorService";
import { ObservableObjectCloseBaseViewModel } from "../../utils/CloseBaseViewModel";
import { IObservableErrors, ObservableErrors } from "../../utils/observableErrors";
import { DelegateCommand, ICommand } from "../../utils/command";
import { ModPackMetaData } from "../servers/serversTypes";
import { ModPackNameNotTakenValidator } from "./modPackNameNotTakenValidator";
import { Observable } from "../../utils/observable";
import { Validator, PropertyValidation } from "../../utils/validation/module";

export class RenameModPackViewModel extends ObservableObjectCloseBaseViewModel implements IObservableErrors {
    private _subscriptions: (() => void)[] = [];

    private _modsService: ModsService;
    private _errorService: ErrorService;

    private _validator: Validator<RenameModPackViewModel>;
    private _errors = new ObservableErrors();

    private _modPack: ModPackMetaData;

    private _name = '';

    private _renameCommand: DelegateCommand;
    private _cancelCommand: DelegateCommand;

    get errors(): ObservableErrors {
        return this._errors;
    }

    get name(): string {
        return this._name;
    }
    set name(value: string) {
        value = value.trim();

        if (this._name === value) {
            this.raise('name', value);
            return;
        }

        this._name = value;
        this.raise('name', value);

        this.validateAll();
    }

    get renameCommand(): ICommand {
        return this._renameCommand;
    }

    get cancelCommand(): ICommand {
        return this._cancelCommand;
    }

    constructor(modPack: ModPackMetaData, modsService: ModsService, errorService: ErrorService) {
        super();

        this._modsService = modsService;
        this._errorService = errorService;

        this._modPack = modPack;
        this._name = modPack.Name;

        this._validator = new Validator<this>(this, [
            new PropertyValidation('name')
                .displayName('Name')
                .notEmptyString()
                .noWhitespaceString()
                .rules(new ModPackNameNotTakenValidator(modsService.modPacks))
        ]);

        this._renameCommand = new DelegateCommand(async () => {
            if (!this.validateAll()) {
                return;
            }

            let result = await this._modsService.renameModPack(this._modPack.Name, this._name);
            if (!result.Success) {
                this._errorService.reportIfError(result);
                return;
            }

            this.close();
        });

        this._cancelCommand = new DelegateCommand(() => this.close());

        modsService.modPacks.subscribe(() => this.validateAll(), this._subscriptions);
    }

    disconnect(): void {
        Observable.unSubscribeAll(this._subscriptions);
    }

    private validateAll(): boolean {
        let validationResult = this._validator.validate('name');
        this.errors.setError('name', validationResult);

        return validationResult.valid;
    }
}