import { InvokeBase } from "../invokeBase";
import { WindowService } from "../../services/windowService";
import { PublicPart } from "../../utils/types";
import { FormDataMock } from "../models/formDataMock";

export class WindowServiceMockBase extends InvokeBase<WindowService> implements PublicPart<WindowService> {
    constructor(strict: boolean = false) {
        super(strict);
    }

    createFormData(): FormData {
        this.invoked('createFormData');
        return new FormDataMock();
    }
}