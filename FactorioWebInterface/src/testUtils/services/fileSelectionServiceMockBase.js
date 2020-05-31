import { InvokeBase } from "../invokeBase";
export class FileSelectionServiceMockBase extends InvokeBase {
    constructor(strict = false) {
        super(strict);
        this._filesToReturn = [];
    }
    getFiles(fileTypes) {
        this.invoked('getFiles', fileTypes);
        return Promise.resolve(this._filesToReturn);
    }
}
//# sourceMappingURL=fileSelectionServiceMockBase.js.map