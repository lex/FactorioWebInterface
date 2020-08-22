import { Result, Error } from "../ts/utils";

export class ErrorService {
    constructor() {
    }

    reportIfError(result: Result): void {
        if (result.Success) {
            return;
        }

        console.error(result.Errors)

        let message = JSON.stringify(result.Errors);
        alert(message);
    }

    reportError(error: string | Error): void {
        console.error(error);

        if (typeof error === 'string') {
            alert(error);
        } else {
            let message = JSON.stringify(error);
            alert(message);
        }
    }
}