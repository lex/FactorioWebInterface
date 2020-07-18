import { ModsService } from "./modsService";
import { ErrorService } from "../../services/errorService";
import { ObservableObjectCloseBaseViewModel, CloseBaseViewModel } from "../../utils/CloseBaseViewModel";
import { DelegateCommand, ICommand } from "../../utils/command";
import { ModPackMetaData } from "../servers/serversTypes";

export class DeleteModPackViewModel extends CloseBaseViewModel {
    private _modsService: ModsService;
    private _errorService: ErrorService;

    private _name = '';

    private _deleteCommand: DelegateCommand;
    private _cancelCommand: DelegateCommand;

    get name(): string {
        return this._name;
    }

    get deleteCommand(): ICommand {
        return this._deleteCommand;
    }

    get cancelCommand(): ICommand {
        return this._cancelCommand;
    }

    constructor(modPack: ModPackMetaData, modsService: ModsService, errorService: ErrorService) {
        super();

        this._modsService = modsService;
        this._errorService = errorService;

        this._name = modPack.Name;

        this._deleteCommand = new DelegateCommand(async () => {
            let result = await this._modsService.deleteModPack(this._name);
            if (!result.Success) {
                this._errorService.reportIfError(result);
                return;
            }

            this.close();
        })

        this._cancelCommand = new DelegateCommand(() => this.close());
    }
}