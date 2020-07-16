import { UploadService, FileUploadEvent } from "../../services/uploadService";
import { PublicPart } from "../../utils/types";
import { InvokeBase } from "../invokeBase";

export class UploadServiceMockBase extends InvokeBase<UploadService> implements PublicPart<UploadService> {
    constructor(strict: boolean = false) {
        super(strict);
    }

    submitForm(url: string, formData: FormData): void {
        this.invoked('submitForm', url, formData);
    }

    uploadFormData(url: string, formData: FormData, callback?: (event: FileUploadEvent) => void): void {
        this.invoked('uploadFormData', url, formData, callback);
    }

    uploadFiles(url: string, files: File[], callback?: (event: FileUploadEvent) => void): void {
        this.invoked('uploadFiles', url, files, callback);
    }
}