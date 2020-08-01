export class RequestVerificationService {
    private _token: string;

    get token(): string {
        if (this._token == null) {
            this.init();
        }

        return this._token;
    }

    private init() {
        let element = (document.querySelector('input[name="__RequestVerificationToken"][type="hidden"]') as HTMLInputElement);
        if (element == null) {
            return;
        }

        this._token = element.value;

        element.remove();
    }
}