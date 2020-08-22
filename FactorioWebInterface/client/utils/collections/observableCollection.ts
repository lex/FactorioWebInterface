import { Observable } from "../observable";
import { CollectionChangedData } from "../../ts/utils";

export interface IKeySelector<K, V> {
    keySelector: (value: V) => K;
}

export abstract class ObservableCollection<T> extends Observable<CollectionChangedData<T>> implements Iterable<T> {
    abstract get count(): number;
    abstract [Symbol.iterator](): Iterator<T>
    abstract values(): IterableIterator<T>;
    abstract bind(callback: (event: CollectionChangedData<T>) => void, subscriptions?: (() => void)[]): () => void;
}

export abstract class ObservableKeyCollection<K, V> extends ObservableCollection<V> implements IKeySelector<K, V>{
    abstract keySelector: (value: V) => K;
}

