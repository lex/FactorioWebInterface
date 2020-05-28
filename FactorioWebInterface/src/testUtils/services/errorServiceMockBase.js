import { InvokeBase } from "../invokeBase";
export class ErrorServiceMockBase extends InvokeBase {
    constructor(strict = false) {
        super(strict);
    }
    reportIfError(result) {
        this.invoked('reportIfError', result);
    }
    reportError(error) {
        this.invoked('reportError', error);
    }
}
//# sourceMappingURL=errorServiceMockBase.js.map