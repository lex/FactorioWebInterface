export class FormDataMock {
    constructor() {
        this._entries = new Map();
    }
    append(name, value, fileName) {
        let entry = this._entries.get(name);
        if (entry == null) {
            entry = [];
            this._entries.set(name, entry);
        }
        entry.push(value);
    }
    delete(name) {
        throw new Error("Method not implemented.");
    }
    get(name) {
        var _a;
        return ((_a = this._entries.get(name)) !== null && _a !== void 0 ? _a : [])[0];
    }
    getAll(name) {
        var _a;
        return (_a = this._entries.get(name)) !== null && _a !== void 0 ? _a : [];
    }
    has(name) {
        return this._entries.has(name);
    }
    set(name, value, fileName) {
        throw new Error("Method not implemented.");
    }
    forEach(callbackfn, thisArg) {
        throw new Error("Method not implemented.");
    }
    [Symbol.iterator]() {
        throw new Error("Method not implemented.");
    }
    entries() {
        throw new Error("Method not implemented.");
    }
    keys() {
        throw new Error("Method not implemented.");
    }
    values() {
        throw new Error("Method not implemented.");
    }
}
//# sourceMappingURL=formDataMock.js.map