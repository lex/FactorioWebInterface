import { PublicPart } from "../../utils/types";
import { ModalServiceBase } from "../../services/ModalServiceBase";
import { InvokeBase } from "../invokeBase";

export class ModalServiceMockBase extends InvokeBase<ModalServiceBase> implements PublicPart<ModalServiceBase> {
    constructor(strict: boolean = false) {
        super(strict);
    }

    showViewModel(viewModel: Object): Promise<void> {
        this.invoked('showViewModel', viewModel);
        return Promise.resolve();
    }
}