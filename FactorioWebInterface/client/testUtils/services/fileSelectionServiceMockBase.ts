import { FileSelectionService } from "../../services/fileSelectionService";
import { InvokeBase } from "../invokeBase";
import { PublicPart } from "../../utils/types";

export class FileSelectionServiceMockBase extends InvokeBase<FileSelectionService> implements PublicPart<FileSelectionService>{
    _filesToReturn: File[] = [];

    constructor(strict: boolean = false) {
        super(strict);
    }

    getFiles(fileTypes?: string): Promise<File[]> {
        this.invoked('getFiles', fileTypes);
        return Promise.resolve(this._filesToReturn);
    }
}
