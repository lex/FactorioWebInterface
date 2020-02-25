export class RequestVerificationService {
    get token() {
        if (this._token == null) {
            this.init();
        }
        return this._token;
    }
    init() {
        let element = document.querySelector('input[name="__RequestVerificationToken"][type="hidden"]');
        if (element == null) {
            return;
        }
        this._token = element.value;
        element.remove();
    }
}
//# sourceMappingURL=requestVerificationService.js.map