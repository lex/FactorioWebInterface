type Entry = string | Blob;

export class FormDataMock implements FormData {
    private _entries = new Map<string, Entry[]>();

    append(name: string, value: string | Blob, fileName?: string): void {
        let entry = this._entries.get(name);
        if (entry == null) {
            entry = [];
            this._entries.set(name, entry);
        }

        entry.push(value);
    }

    delete(name: string): void {
        throw new Error("Method not implemented.");
    }

    get(name: string): FormDataEntryValue {
        return (this._entries.get(name) ?? [])[0] as FormDataEntryValue;
    }

    getAll(name: string): FormDataEntryValue[] {
        return (this._entries.get(name) as FormDataEntryValue[]) ?? [];
    }

    has(name: string): boolean {
        return this._entries.has(name);
    }

    set(name: string, value: string | Blob, fileName?: string): void {
        throw new Error("Method not implemented.");
    }

    forEach(callbackfn: (value: FormDataEntryValue, key: string, parent: FormData) => void, thisArg?: any): void {
        throw new Error("Method not implemented.");
    }

    [Symbol.iterator](): IterableIterator<[string, FormDataEntryValue]> {
        throw new Error("Method not implemented.");
    }

    entries(): IterableIterator<[string, FormDataEntryValue]> {
        throw new Error("Method not implemented.");
    }

    keys(): IterableIterator<string> {
        throw new Error("Method not implemented.");
    }

    values(): IterableIterator<FormDataEntryValue> {
        throw new Error("Method not implemented.");
    }
}