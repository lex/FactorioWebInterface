import { PublicPart } from "../../utils/types";
import { IModalService } from "../../services/iModalService";
import { InvokeBase } from "../invokeBase";

export class ModalServiceMockBase extends InvokeBase<IModalService> implements PublicPart<IModalService> {
    constructor(strict: boolean = false) {
        super(strict);
    }

    showViewModel(viewModel: Object): Promise<void> {
        this.invoked('showViewModel', viewModel);
        return Promise.resolve();
    }
}