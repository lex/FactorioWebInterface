import { InvokeBase } from "../invokeBase";
export class FileSelectionServiceMockBase extends InvokeBase {
    constructor(strict = false) {
        super(strict);
    }
    getFiles(fileTypes) {
        this.invoked('getFiles', fileTypes);
        return Promise.resolve([]);
    }
}
//# sourceMappingURL=fileSelectionServiceMockBase.js.map