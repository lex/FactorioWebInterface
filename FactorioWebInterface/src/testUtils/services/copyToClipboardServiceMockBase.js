import { InvokeBase } from "../invokeBase";
export class CopyToClipboardServiceMockBase extends InvokeBase {
    constructor(strict = false) {
        super(strict);
    }
    copy(text) {
        this.invoked('copy', text);
    }
}
//# sourceMappingURL=copyToClipboardServiceMockBase.js.map