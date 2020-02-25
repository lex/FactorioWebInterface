import { Observable } from "./observable";

export interface IObservableObject<T = object> {
    propertyChanged(callback: (sender: T, event: string) => void): () => void;
}

export abstract class ObservableObject<T = object> implements IObservableObject<T> {
    private _propertyChangeObservable = new Observable<T, string>();

    propertyChanged(callback: (sender: T, event: string) => void): () => void {
        return this._propertyChangeObservable.subscribe(callback);
    }

    raise(propertyName: string) {
        this._propertyChangeObservable.raise(this as any as T, propertyName);
    }

    protected setAndRaise(fields: object, propertyName: string, value: any) {
        let old = fields[propertyName];

        if (old === value) {
            return false;
        }

        fields[propertyName] = value;
        this.raise(propertyName);
        return true;
    }
}