import { InvokeBase } from "../invokeBase";
import { FormDataMock } from "../models/formDataMock";
export class WindowServiceMockBase extends InvokeBase {
    constructor(strict = false) {
        super(strict);
    }
    createFormData() {
        this.invoked('createFormData');
        return new FormDataMock();
    }
}
//# sourceMappingURL=windowServiceMockBase.js.map