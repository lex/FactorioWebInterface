import { ObservableCollection, ObservableKeyCollection } from "./observableCollection";
import { Observable, IObservable } from "../observable";
import { ObservableProperty, IObservableProperty } from "../observableProperty";
import { IterableHelper } from "../iterableHelper";
import { CollectionChangedData, CollectionChangeType } from "../../ts/utils";
import { ArrayHelper } from "../arrayHelper";

export interface SortSpecification<T> {
    // Comparator that sorts T in ascending order, if not set, ascendingBoxComparator or property should be set.
    ascendingComparator?: (left: T, right: T) => number;
    // If ascendingComparator and ascendingBoxComparator is not set, the property that should be used to sort T.
    property?: string;
    // An optional Id used to identify what is being sorted, use if property can't be used.
    sortId?: any;
    // Sort T ascending (default) or descending (set to false).
    ascending?: boolean;
}

export interface FilterSpecifications<T> {
    predicate?: (value: T) => boolean;
}

export enum CollectionViewChangeType {
    Reset = "Reset",
    Reorder = "Reorder",
    Remove = "Remove",
    Add = "Add"
}

export interface CollectionViewChangedData<T> {
    type: CollectionViewChangeType;
    items?: T[];
}

export class CollectionView<T, K = any> extends Observable<CollectionViewChangedData<T>> implements Iterable<T> {
    static readonly selectedSortId = {};

    private _source: ObservableCollection<T>;
    private _keySelector: (value: T) => K;

    private _map: Map<K, T>;
    private _array: T[];
    private _selected: Set<K>;

    private _sortSpecifications: ObservableProperty<SortSpecification<T>[]> = new ObservableProperty([]);
    private _comparator: (left: T, right: T) => number;

    private _filterSpecifications: ObservableProperty<FilterSpecifications<T>[]> = new ObservableProperty([]);
    private _predicate: (value: T) => boolean;

    private _selectedChanged: Observable<CollectionViewChangedData<T>>;

    get selectedSortId(): any {
        return CollectionView.selectedSortId;
    }

    [Symbol.iterator](): IterableIterator<T> {
        return this._array.values();
    }

    values(): IterableIterator<T> {
        return this._array.values();
    }

    get keySelector(): (value: T) => K {
        return this._keySelector;
    }

    get selectedKeys(): IterableIterator<K> {
        return this._selected.values();
    }

    get selected(): IterableIterator<T> {
        let map = this._map;
        return IterableHelper.map(this._selected.values(), x => map.get(x));
    }

    get selectedCount(): number {
        return this._selected.size
    }

    get viewableSelected(): IterableIterator<T> {
        let filter = this._predicate
        if (filter == null) {
            return this.selected
        }

        return IterableHelper.where(this.selected, filter);
    }

    get selectedChanged(): IObservable<CollectionViewChangedData<T>> {
        return this._selectedChanged;
    }

    get newSingleSelectedChanged(): IObservable<CollectionViewChangedData<T>> {
        return new CollectionViewNewSingleSelectedObservable(this);
    }

    get isSorted(): boolean {
        return this._comparator != null;
    }

    get sortSpecifications(): SortSpecification<T>[] {
        return this._sortSpecifications.value;
    }

    get sortChanged(): IObservableProperty<SortSpecification<T>[]> {
        return this._sortSpecifications
    }

    constructor(source: ObservableCollection<T>, keySelector?: (value: T) => K) {
        super();
        this._source = source;
        this._selected = new Set();
        this._selectedChanged = new Observable();

        this._keySelector = keySelector;
        if (this._keySelector == null && this._source instanceof ObservableKeyCollection) {
            this._keySelector = this._source.keySelector;
        }

        if (this._keySelector == null) {
            throw 'keySelector must be set or source must provide a keySelector';
        }

        this._array = [];
        this._map = new Map();

        this.doReset();
        this.sort();

        this._source.subscribe((event) => this.update(event));
    }

    bind(callback: (event: CollectionViewChangedData<T>) => void, subscriptions?: (() => void)[]): () => void {
        let subscription = this.subscribe(callback, subscriptions);

        callback({ type: CollectionViewChangeType.Reset });

        return subscription;
    }

    getItemByKey(key: K): T {
        return this._map.get(key);
    }

    isSelected(key: K): boolean {
        return this._selected.has(key);
    }

    isSelectedItem(item: T): boolean {
        return this.isSelected(this._keySelector(item));
    }

    setSingleSelected(key: K | undefined) {
        if (key === undefined) {
            this.unSelectAll();
            return;
        }

        let selected = this._selected;
        let oldSelected = selected.values();

        if (selected.has(key)) {
            if (selected.size === 1) {
                return;
            }

            let removedKeys = IterableHelper.where(oldSelected, x => x !== key);
            let removedItems = [...IterableHelper.map(removedKeys, x => this._map.get(x))];

            selected.clear();
            selected.add(key);
            this.raise({ type: CollectionViewChangeType.Add, items: removedItems });

            if (this.isSortedBySelection()) {
                this.sort();
                this.raise({ type: CollectionViewChangeType.Reorder });
            }

            if (removedItems.length > 0) {
                this._selectedChanged.raise({ type: CollectionViewChangeType.Remove, items: removedItems });
            }

            return;
        }

        let removedItems = [...IterableHelper.map(oldSelected, x => this._map.get(x))];
        let addItem = this._map.get(key);

        selected.clear();

        let added = false;
        if (addItem != null && this.isAllowedByFilter(addItem)) {
            added = true;
            selected.add(key);
            this.raise({ type: CollectionViewChangeType.Add, items: [...removedItems, addItem] });
        }

        if ((added || removedItems.length > 0) && this.isSortedBySelection()) {
            this.sort();
            this.raise({ type: CollectionViewChangeType.Reorder });
        }

        if (removedItems.length > 0) {
            this._selectedChanged.raise({ type: CollectionViewChangeType.Remove, items: removedItems });
        }

        if (added) {
            this._selectedChanged.raise({ type: CollectionViewChangeType.Add, items: [addItem] });
        }
    }

    setSingleSelectedItem(item: T) {
        return this.setSingleSelected(this._keySelector(item));
    }

    setSelected(key: K, selected: boolean) {
        let item = this._map.get(key);

        if (selected) {
            if (item === undefined || this._selected.has(key) || !this.isAllowedByFilter(item)) {
                return;
            }

            this._selected.add(key);
        } else {
            if (!this._selected.delete(key)) {
                return;
            }
        }

        this.raise({ type: CollectionViewChangeType.Add, items: [item] });

        if (this.isSortedBySelection()) {
            this.sort();
            this.raise({ type: CollectionViewChangeType.Reorder });
        }

        this._selectedChanged.raise({ type: selected ? CollectionViewChangeType.Add : CollectionViewChangeType.Remove, items: [item] });
    }

    setSelectedItem(item: T, selected: boolean) {
        return this.setSelected(this._keySelector(item), selected);
    }

    unSelectAll() {
        let selectedItems = [...this.selected];

        if (selectedItems.length === 0) {
            return;
        }

        this._selected.clear();
        this.raise({ type: CollectionViewChangeType.Add, items: selectedItems });

        if (this.isSortedBySelection()) {
            this.sort();
            this.raise({ type: CollectionViewChangeType.Reorder });
        }

        this._selectedChanged.raise({ type: CollectionViewChangeType.Remove, items: selectedItems });
    }

    selectAll() {
        let selected = this._selected;
        let change: T[] = [];

        let filter = this._predicate;
        if (filter) {
            for (let [key, item] of this._map) {
                if (!selected.has(key) && filter(item)) {
                    selected.add(key);
                    change.push(item);
                }
            }
        } else {
            for (let [key, item] of this._map) {
                if (!selected.has(key)) {
                    selected.add(key);
                    change.push(item);
                }
            }
        }

        if (change.length === 0) {
            return;
        }

        let event = { type: CollectionViewChangeType.Add, items: change };
        this.raise(event);

        if (this.isSortedBySelection()) {
            this.sort();
            this.raise({ type: CollectionViewChangeType.Reorder });
        }

        this._selectedChanged.raise(event);
    }

    setFirstSingleSelected(): void {
        let first = this._array[0];
        if (first === undefined) {
            return;
        }

        let key = this._keySelector(first);
        if (key !== undefined) {
            this.setSingleSelected(key);
        }
    }

    sortBy(sortSpecifications: SortSpecification<T> | SortSpecification<T>[]): void {
        if (!Array.isArray(sortSpecifications)) {
            sortSpecifications = [sortSpecifications];
        }

        if (sortSpecifications.length === 0 || sortSpecifications[0] == null) {
            this._comparator = undefined;
            this._sortSpecifications.raise([]);
            return;
        }

        let comp: (left: T, right: T) => number;

        if (sortSpecifications.length === 1) {
            comp = this.buildComparator(sortSpecifications[0]);
        } else {
            let comps: ((left: T, right: T) => number)[] = [];
            for (let i = 0; i < sortSpecifications.length; i++) {
                let sortSpecification = sortSpecifications[i];
                comps.push(this.buildComparator(sortSpecification));
            }

            comp = ((left: T, right: T): number => {
                let sign = 0;
                for (let c = 0; c < comps.length; c++) {
                    sign = comps[c](left, right);
                    if (sign !== 0) {
                        return sign;
                    }
                }
                return sign;
            });
        }

        this._comparator = comp;
        this._sortSpecifications.raise(sortSpecifications);

        this.sort();
        this.raise({ type: CollectionViewChangeType.Reorder });
    }

    selectedComparatorBuilder(): (left: T, right: T) => number {
        let selected = this._selected;
        let keySelector = this._keySelector;

        return ((left: T, right: T): number => {
            let leftSelected = selected.has(keySelector(left));
            let rightSelected = selected.has(keySelector(right));

            if (leftSelected === rightSelected) {
                return 0;
            } else if (leftSelected) {
                return 1;
            } else {
                return -1;
            }
        });
    }

    private buildComparator(sortSpecification: SortSpecification<T>): (left: T, right: T) => number {
        let comp: (left: T, right: T) => number;

        if (sortSpecification.ascendingComparator != null) {
            comp = sortSpecification.ascendingComparator;
        }
        else if (sortSpecification.property) {
            let property = sortSpecification.property;

            comp = ((left, right) => {
                left = left[property];
                right = right[property];
                if (left === right) {
                    return 0;
                } else if (left > right) {
                    return 1;
                } else {
                    return -1;
                }
            });
        } else {
            comp = ((left, right) => {
                if (left === right) {
                    return 0;
                } else if (left > right) {
                    return 1;
                } else {
                    return -1;
                }
            });
        }

        if (sortSpecification.ascending === false) {
            let oldComp = comp;
            comp = (left, right) => oldComp(right, left);
        }

        return comp;
    }

    filterBy(filterSpecifications?: FilterSpecifications<T> | FilterSpecifications<T>[]): void {
        if (!Array.isArray(filterSpecifications)) {
            filterSpecifications = [filterSpecifications];
        }

        let filter = CollectionView.buildPredicate(filterSpecifications);
        this._predicate = filter;

        let selected = this._selected;
        let oldSelectedKeys = [...selected];

        this.doReset();

        if (filter == null) {
            for (const key of oldSelectedKeys) {
                selected.add(key);
            }
        } else {
            let map = this._map;
            for (const key of oldSelectedKeys) {
                let item = map.get(key);
                if (item !== undefined && filter(item)) {
                    selected.add(key);
                }
            }
        }

        this.sort();
        this.raise({ type: CollectionViewChangeType.Reset });
        this._filterSpecifications.raise(filterSpecifications);
    }

    private static buildPredicate<T>(filterSpecifications: FilterSpecifications<T>[]): (item: T) => boolean {
        if (filterSpecifications.length === 0 || filterSpecifications[0] == null) {
            return undefined;
        }

        let predicates = [...IterableHelper.map(filterSpecifications.values(), f => {
            return f.predicate ?? (() => true);
        })];

        return ((item: T) => {
            for (let i = 0; i < predicates.length; i++) {
                if (!predicates[i](item)) {
                    return false;
                }
            }

            return true;
        });
    }

    private update(changeData: CollectionChangedData): void {
        switch (changeData.Type) {
            case CollectionChangeType.Reset:
                let selectedChanged = this.doReset(changeData.NewItems);
                this.sort();

                if (selectedChanged) {
                    this.raise({ type: CollectionViewChangeType.Reset });
                } else {
                    let sub = this.selectedChanged.subscribe(() => selectedChanged = true);
                    this.raise({ type: CollectionViewChangeType.Reset });
                    sub();
                }

                if (selectedChanged) {
                    this._selectedChanged.raise({ type: CollectionViewChangeType.Reset });
                }
                break;
            case CollectionChangeType.Remove: {
                let { removed, selectedRemoved } = this.doRemove(changeData.OldItems);
                if (removed.length === 0) {
                    return;
                }

                this.raise({ type: CollectionViewChangeType.Remove, items: removed });
                if (selectedRemoved.length > 0) {
                    this._selectedChanged.raise({ type: CollectionViewChangeType.Remove, items: selectedRemoved });
                }
                break;
            }
            case CollectionChangeType.Add: {
                let [added, removed] = this.doAdd(changeData.NewItems);

                this.doAddAndRemovedSortAndRaise(added, removed);
                break;
            }
            case CollectionChangeType.AddAndRemove: {
                let { removed, selectedRemoved } = this.doRemove(changeData.OldItems);
                let [added, updateRemoved] = this.doAdd(changeData.NewItems);
                let allRemoved = [...removed, ...updateRemoved];

                this.doAddAndRemovedSortAndRaise(added, allRemoved);
                if (selectedRemoved) {
                    this._selectedChanged.raise({ type: CollectionViewChangeType.Remove, items: selectedRemoved });
                }
                break;
            }
            default:
                return;
        }
    }

    private doReset(items?: T[]): boolean {
        let array = this._array;
        array.length = 0;
        let map = this._map;
        map.clear();

        let iterator = (items == null)
            ? this._source.values()
            : items.values();

        let filter = this._predicate;
        if (filter != null) {
            for (let item of iterator) {
                if (!filter(item)) {
                    continue;
                }

                let key = this._keySelector(item);
                map.set(key, item);
            }
        } else {
            for (let item of iterator) {
                let key = this._keySelector(item);
                map.set(key, item);
            }
        }

        array.push(...map.values());

        let selected = this._selected;
        if (selected.size > 0) {
            this._selected.clear();
            return true;
        }

        return false;
    }

    private doAdd(items: T[]): [T[], T[]] {
        let removed: T[] = [];

        if (items == null) {
            return [[], removed];
        }

        let array = this._array;
        let keySelector = this._keySelector;
        let filter = this._predicate;

        let map = this._map;
        let added = new Map<K, T>();

        if (filter == null) {
            for (let item of items) {
                let key = keySelector(item);

                let oldItem = map.get(key);
                if (oldItem !== undefined) {
                    ArrayHelper.replace(array, oldItem, item);
                } else {
                    array.push(item);
                }

                map.set(key, item);
                added.set(key, item);
            }

            return [[...added.values()], removed];
        }

        for (let item of items) {
            let key = keySelector(item);

            let oldItem = map.get(key);
            if (oldItem !== undefined) {
                if (filter(item)) {
                    ArrayHelper.replace(array, oldItem, item);
                    map.set(key, item);
                    added.set(key, item);
                } else {
                    map.delete(key);
                    ArrayHelper.remove(array, oldItem);
                    removed.push(item);
                }

                continue;
            }

            if (filter(item)) {
                map.set(key, item);
                array.push(item);
                added.set(key, item);
            }
        }

        return [[...added.values()], removed];
    }

    private doRemove(items: T[]): { removed: T[], selectedRemoved: T[] } {
        let removed: T[] = [];
        let array = this._array;
        let keySelector = this._keySelector;
        let selectedRemoved: T[] = [];
        let map = this._map;

        for (let i = 0; i < items.length; i++) {
            let item = items[i];
            let key = keySelector(item);

            let oldItem = map.get(key);
            if (oldItem === undefined || !map.delete(key)) {
                continue;
            }

            ArrayHelper.remove(array, oldItem);
            removed.push(oldItem);

            if (this._selected.delete(key)) {
                selectedRemoved.push(oldItem);
            }
        }

        return { removed, selectedRemoved };
    }

    private doAddAndRemovedSortAndRaise(added: T[], removed: T[]): void {
        if (removed.length === 0 && added.length === 0) {
            return;
        }

        if (added.length !== 0) {
            this.sort();
        }

        if (removed.length !== 0) {
            this.raise({ type: CollectionViewChangeType.Remove, items: removed });
        }

        if (added.length !== 0) {
            this.raise({ type: CollectionViewChangeType.Add, items: added });

            if (this._comparator != null) {
                this.raise({ type: CollectionViewChangeType.Reorder });
            }
        }
    }

    private sort(): void {
        let comparator = this._comparator;
        if (comparator == null) {
            return;
        }

        this._array.sort(comparator);
    }

    private isSortedBySelection(): boolean {
        for (let sortSpecification of this._sortSpecifications.value) {
            if (sortSpecification.sortId === this.selectedSortId) {
                return true;
            }
        }

        return false;
    }

    private isAllowedByFilter(item: T): boolean {
        let filter = this._predicate;

        if (filter == null) {
            return true;
        }

        return filter(item);
    }
}

class CollectionViewNewSingleSelectedObservable<T> implements IObservable<CollectionViewChangedData<T>>{
    constructor(private readonly collectionView: CollectionView<T>) { }

    subscribe(callback: (event: CollectionViewChangedData<T>) => void, subscriptions?: (() => void)[]): () => void {
        let filterdCallback = (event: CollectionViewChangedData<T>) => {
            if (event.type === CollectionViewChangeType.Remove && this.collectionView.selectedCount === 1) {
                return;
            }

            callback(event);
        };

        return this.collectionView.selectedChanged.subscribe(filterdCallback, subscriptions);
    }
}
