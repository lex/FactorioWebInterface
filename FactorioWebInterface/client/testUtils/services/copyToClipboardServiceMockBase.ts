import { CopyToClipboardService } from "../../services/copyToClipboardService";
import { InvokeBase } from "../invokeBase";
import { PublicPart } from "../../utils/types";

export class CopyToClipboardServiceMockBase extends InvokeBase<CopyToClipboardService> implements PublicPart<CopyToClipboardService>{
    constructor(strict: boolean = false) {
        super(strict);
    }

    copy(text: string): void {
        this.invoked('copy', text);
    }
}