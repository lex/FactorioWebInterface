import { InvokeBase } from "../invokeBase";
export class ModalServiceMockBase extends InvokeBase {
    constructor(strict = false) {
        super(strict);
    }
    showViewModel(viewModel) {
        this.invoked('showViewModel', viewModel);
        return Promise.resolve();
    }
}
//# sourceMappingURL=modalServiceMockBase.js.map