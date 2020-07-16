import { InvokeBase } from "../invokeBase";
export class UploadServiceMockBase extends InvokeBase {
    constructor(strict = false) {
        super(strict);
    }
    submitForm(url, formData) {
        this.invoked('submitForm', url, formData);
    }
    uploadFormData(url, formData, callback) {
        this.invoked('uploadFormData', url, formData, callback);
    }
    uploadFiles(url, files, callback) {
        this.invoked('uploadFiles', url, files, callback);
    }
}
//# sourceMappingURL=uploadServiceMockBase.js.map