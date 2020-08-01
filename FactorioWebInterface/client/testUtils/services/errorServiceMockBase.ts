import { ErrorService } from "../../services/errorService";
import { PublicPart } from "../../utils/types";
import { InvokeBase } from "../invokeBase";
import { Result, Error } from "../../ts/utils";

export class ErrorServiceMockBase extends InvokeBase<ErrorService> implements PublicPart<ErrorService> {
    constructor(strict: boolean = false) {
        super(strict);
    }

    reportIfError(result: Result<void>): void {
        this.invoked('reportIfError', result);

    }
    reportError(error: string | Error): void {
        this.invoked('reportError', error);
    }
}