import { IObservableObject } from "./observableObject";

export interface IFieldProperty<TSender = object, TValue = any> extends IObservableObject<TSender> {
    value: TValue;
    label: string;
    error: string;
    enabled: boolean;
}

export class FieldProperty<TSender = object, TValue = any> implements IFieldProperty<TSender, TValue> {
    value: TValue;
    label: string;
    error: string;
    enabled: boolean;
    propertyChanged(callback: (sender: TSender, event: string) => void): () => void {
        throw new Error("Method not implemented.");
    }


}
