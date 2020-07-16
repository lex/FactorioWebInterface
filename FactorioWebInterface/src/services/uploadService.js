export var FileUploadEventType;
(function (FileUploadEventType) {
    FileUploadEventType["start"] = "start";
    FileUploadEventType["progress"] = "progress";
    FileUploadEventType["end"] = "end";
})(FileUploadEventType || (FileUploadEventType = {}));
export class UploadService {
    constructor(requestVerificationService, documentService) {
        this._requestVerificationService = requestVerificationService;
        this._documentService = documentService;
    }
    submitForm(url, formData) {
        let form = this._documentService.createForm();
        form.method = 'POST';
        form.action = url;
        form.style.display = 'none';
        for (let data of formData) {
            let input = this._documentService.createInput();
            input.name = data[0];
            input.value = data[1].toString();
            form.append(input);
        }
        let tokenInput = this._documentService.createInput();
        tokenInput.type = 'hidden';
        tokenInput.name = '__RequestVerificationToken';
        tokenInput.value = this._requestVerificationService.token;
        form.append(tokenInput);
        document.body.append(form);
        form.submit();
        form.remove();
    }
    uploadFormData(url, formData, callback) {
        let xhr = new XMLHttpRequest();
        xhr.open('POST', url, true);
        xhr.setRequestHeader('RequestVerificationToken', this._requestVerificationService.token);
        if (callback != null) {
            function loadstart(event) {
                callback({ type: FileUploadEventType.start });
            }
            function progress(event) {
                callback({ type: FileUploadEventType.progress, loaded: event.loaded, total: event.total });
            }
            xhr.upload.addEventListener('loadstart', loadstart, false);
            xhr.upload.addEventListener("progress", progress, false);
            xhr.onloadend = function (event) {
                var _a;
                let result;
                let text = xhr.responseText;
                let parsed;
                try {
                    parsed = JSON.parse(text);
                }
                catch (_b) {
                    result = { Success: false, Errors: [{ Key: 'UploadError', Description: text }] };
                }
                if (parsed.Success) {
                    result = { Success: true };
                }
                else {
                    result = { Success: false, Errors: (_a = parsed.Errors) !== null && _a !== void 0 ? _a : [{ Key: 'UploadError', Description: text }] };
                }
                callback({ type: FileUploadEventType.end, result: result });
                xhr.onloadend = undefined;
                xhr.upload.removeEventListener('loadstart', loadstart);
                xhr.upload.removeEventListener('progress', progress);
            };
        }
        xhr.send(formData);
    }
    uploadFiles(url, files, callback) {
        let formData = new FormData();
        for (let file of files) {
            formData.append('files', file);
        }
        this.uploadFormData(url, formData, callback);
    }
}
//# sourceMappingURL=uploadService.js.map