import { FileSelectionService } from "../../services/fileSelectionservice";
import { InvokeBase } from "../invokeBase";
import { PublicPart } from "../../utils/types";

export class FileSelectionServiceMockBase extends InvokeBase<FileSelectionService> implements PublicPart<FileSelectionService>{
    constructor(strict: boolean = false) {
        super(strict);
    }

    getFiles(fileTypes?: string): Promise<File[]> {
        this.invoked('getFiles', fileTypes);
        return Promise.resolve([]);
    }
}