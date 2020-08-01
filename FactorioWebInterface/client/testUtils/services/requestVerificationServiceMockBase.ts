import { InvokeBase } from "../invokeBase";
import { RequestVerificationService } from "../../services/requestVerificationService";
import { PublicPart } from "../../utils/types";

export class RequestVerificationServiceMockBase extends InvokeBase<RequestVerificationService> implements PublicPart<RequestVerificationService> {
    constructor(strict: boolean = false) {
        super(strict);
    }

    get token(): string {
        this.invoked('token');
        return 'token';
    }
}