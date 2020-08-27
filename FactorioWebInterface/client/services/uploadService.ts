import { RequestVerificationService } from "./requestVerificationService";
import { Result } from "../ts/utils";
import { IDocumentService } from "./iDocumentService";

export enum FileUploadEventType {
    start = 'start',
    progress = 'progress',
    end = 'end'
}

export interface FileUploadEvent {
    type: FileUploadEventType;
    loaded?: number;
    total?: number;
    result?: Result;
}

export class UploadService {
    private readonly _requestVerificationService: RequestVerificationService;
    private readonly _documentService: IDocumentService;

    constructor(requestVerificationService: RequestVerificationService, documentService: IDocumentService) {
        this._requestVerificationService = requestVerificationService;
        this._documentService = documentService;
    }

    submitForm(url: string, formData: FormData): void {
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

    uploadFormData(url: string, formData: FormData, callback?: (event: FileUploadEvent) => void): void {
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
                let result: Result;

                let text = xhr.responseText;
                let parsed: Result;
                try {
                    parsed = JSON.parse(text)
                }
                catch {
                }

                if (parsed?.Success) {
                    result = { Success: true };
                } else {
                    result = { Success: false, Errors: parsed?.Errors ?? [{ Key: 'UploadError', Description: text }] };
                }

                callback({ type: FileUploadEventType.end, result: result });

                xhr.onloadend = undefined;
                xhr.upload.removeEventListener('loadstart', loadstart);
                xhr.upload.removeEventListener('progress', progress);
            }
        }

        xhr.send(formData);
    }

    uploadFiles(url: string, files: File[], callback?: (event: FileUploadEvent) => void): void {
        let formData = new FormData();
        for (let file of files) {
            formData.append('files', file);
        }

        this.uploadFormData(url, formData, callback);
    }
}