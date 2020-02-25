export class ErrorService {
    constructor() {
    }
    reportIfError(result) {
        if (result.Success) {
            return;
        }
        console.error(result.Errors);
        let message = JSON.stringify(result.Errors);
        alert(message);
    }
    reportError(error) {
        console.error(error);
        if (typeof error === 'string') {
            alert(error);
        }
        else {
            let message = JSON.stringify(error);
            alert(message);
        }
    }
}
//# sourceMappingURL=errorService.js.map