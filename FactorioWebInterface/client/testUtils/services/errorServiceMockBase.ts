import { ErrorService } from "../../services/errorService";
import { PublicPart } from "../../utils/types";
import { InvokeBase } from "../invokeBase";
import { Result, Error } from "../../ts/utils";
import { AssertionError } from "assert";

export class ErrorServiceMockBase extends InvokeBase<ErrorService> implements PublicPart<ErrorService> {
    _errorsReported: (string | Error)[] = [];

    constructor(strict: boolean = false) {
        super(strict);
    }

    reportIfError(result: Result<void>): void {
        if (!result.Success) {
            this._errorsReported.push(...result.Errors ?? ['missing error']);
        }

        this.invoked('reportIfError', result);
    }

    reportError(error: string | Error): void {
        this._errorsReported.push(error ?? 'missing error');

        this.invoked('reportError', error);
    }

    assertNoErrorsReported(): void {
        if (this._errorsReported.length > 0) {
            throw new AssertionError({ message: `Errors reported when none where expected.\n${this._errorsReported}` });
        }
    }
}