import { InvokeBase } from "../invokeBase";
export class RequestVerificationServiceMockBase extends InvokeBase {
    constructor(strict = false) {
        super(strict);
    }
    get token() {
        this.invoked('token');
        return 'token';
    }
}
//# sourceMappingURL=requestVerificationServiceMockBase.js.map