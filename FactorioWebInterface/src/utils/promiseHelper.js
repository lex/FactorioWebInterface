export class PromiseHelper {
    static delay(milliseconds) {
        return new Promise(resolve => {
            setTimeout(resolve, milliseconds);
        });
    }
}
//# sourceMappingURL=promiseHelper.js.map