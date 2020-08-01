import { ObservableCollection, ObservableKeyCollection } from "./observableCollection";
import { Observable, IObservable } from "../observable";
import { Box } from "../box";
import { ObservableProperty, IObservableProperty } from "../observableProperty";
import { IterableHelper } from "../iterableHelper";
import { CollectionChangedData, CollectionChangeType } from "../../ts/utils";
import { ArrayHelper } from "../arrayHelper";

export interface SortSpecification<T> {
    // Comparator that sorts T in ascending order, if not set, ascendingBoxComparator or property should be set.
    ascendingComparator?: (left: T, right: T) => number;
    // Comparator that sorts Box<T> in ascending order, if not set, ascendingComparator or property should be set.
    ascendingBoxComparator?: (left: Box<T>, right: Box<T>) => number;
    // If ascendingComparator and ascendingBoxComparator is not set, the property that should be used to sort T.
    property?: string;
    // An optional Id used to identify what is being sorted, use if property can't be used.
    sortId?: any;
    // Sort T ascending (default) or descending (set to false).
    ascending?: boolean;
}

export interface FilterSpecifications<T> {
    predicate?: (value: T) => boolean;
    boxPredicate?: (value: Box<T>) => boolean;
}

export enum CollectionViewChangeType {
    Reset = "Reset",
    Reorder = "Reorder",
    Remove = "Remove",
    Add = "Add"
}

export interface CollectionViewChangedData<T> {
    type: CollectionViewChangeType;
    items?: Box<T>[];
}

export class CollectionView<T> extends Observable<CollectionViewChangedData<T>> implements Iterable<Box<T>> {
    static readonly selectedSortId = {};

    private _source: ObservableCollection<T>;
    private _keySelector: (value: T) => any;

    private _map: Map<any, Box<T>>;
    private _array: Box<T>[];
    private _selected: Set<Box<T>>;

    private _sortSpecifications: ObservableProperty<SortSpecification<T>[]> = new ObservableProperty([]);
    private _comparator: (left: Box<T>, right: Box<T>) => number;

    private _filterSpecifications: ObservableProperty<FilterSpecifications<T>[]> = new ObservableProperty([]);
    private _predicate: (value: Box<T>) => boolean;

    private _selectedChanged: Observable<CollectionViewChangedData<T>>;

    get selectedSortId(): any {
        return CollectionView.selectedSortId;
    }

    [Symbol.iterator](): IterableIterator<Box<T>> {
        return this._array.values();
    }

    values(): IterableIterator<Box<T>> {
        return this._array.values();
    }

    get selected(): IterableIterator<Box<T>> {
        return this._selected.values();
    }

    get selectedCount(): number {
        return this._selected.size
    }

    get viewableSelected(): IterableIterator<Box<T>> {
        let iterator = this._selected.values();
        if (this._predicate == null) {
            return iterator;
        }

        return IterableHelper.where(iterator, this._predicate);
    }

    get selectedChanged(): IObservable<CollectionViewChangedData<T>> {
        return this._selectedChanged;
    }

    get sortSpecifications(): SortSpecification<T>[] {
        return this._sortSpecifications.value;
    }

    get sortChanged(): IObservableProperty<SortSpecification<T>[]> {
        return this._sortSpecifications
    }

    constructor(source: ObservableCollection<T>, keySelector?: (value: T) => any) {
        super();
        this._source = source;
        this._selected = new Set();
        this._selectedChanged = new Observable();

        this._keySelector = keySelector;
        if (this._keySelector === undefined && this._source instanceof ObservableKeyCollection) {
            this._keySelector = this._source.keySelector;
        }

        this._array = [];
        if (this._keySelector !== undefined) {
            this._map = new Map();
        }

        this.doReset();
        this.sort();

        this._source.subscribe((event) => this.update(event));
    }

    bind(callback: (event: CollectionViewChangedData<T>) => void, subscriptions?: (() => void)[]): () => void {
        let subscription = this.subscribe(callback, subscriptions);

        callback({ type: CollectionViewChangeType.Reset });

        return subscription;
    }

    getBoxByKey(key: any): Box<T> {
        return this._map?.get(key);
    }

    getBoxByItem(item: T): Box<T> {
        if (this._keySelector === undefined) {
            let array = this._array;
            for (let i = 0; i < array.length; i++) {
                let box = array[i];
                if (box.value === item) {
                    return box;
                }
            }
        } else {
            let key = this._keySelector(item);
            return this._map.get(key);
        }
    }

    isSelected(box: Box<T>): boolean {
        return this._selected.has(box);
    }

    setSingleSelected(item: Box<T> | undefined) {
        if (item == null) {
            this.unSelectAll();
            return;
        }

        let selected = this._selected;
        let oldSelected = selected.values();

        if (selected.has(item)) {
            if (selected.size === 1) {
                return;
            }

            let removed = [...IterableHelper.where(oldSelected, x => x !== item)];

            selected.clear();
            selected.add(item);
            this.raise({ type: CollectionViewChangeType.Add, items: removed });

            if (this.isSortedBySelection()) {
                this.sort();
                this.raise({ type: CollectionViewChangeType.Reorder });
            }

            this._selectedChanged.raise({ type: CollectionViewChangeType.Remove, items: removed });
            this._selectedChanged.raise({ type: CollectionViewChangeType.Add, items: [item] });

            return;
        }

        let removed = [...oldSelected]
        selected.clear();
        selected.add(item);
        this.raise({ type: CollectionViewChangeType.Add, items: [...removed, item] });

        if (this.isSortedBySelection()) {
            this.sort();
            this.raise({ type: CollectionViewChangeType.Reorder });
        }

        this._selectedChanged.raise({ type: CollectionViewChangeType.Remove, items: removed });
        this._selectedChanged.raise({ type: CollectionViewChangeType.Add, items: [item] });
    }

    setSelected(item: Box<T>, selected: boolean) {
        if (selected) {
            if (this._selected.has(item)) {
                return;
            }
            this._selected.add(item);
        } else {
            if (!this._selected.delete(item)) {
                return;
            }
        }

        // todo - check filter.

        this.raise({ type: CollectionViewChangeType.Add, items: [item] });

        if (this.isSortedBySelection()) {
            this.sort();
            this.raise({ type: CollectionViewChangeType.Reorder });
        }

        this._selectedChanged.raise({ type: selected ? CollectionViewChangeType.Add : CollectionViewChangeType.Remove, items: [item] });
    }

    unSelectAll() {
        let selected = [...this._selected.values()];

        if (selected.length === 0) {
            return;
        }

        this._selected.clear();
        this.raise({ type: CollectionViewChangeType.Add, items: selected });

        if (this.isSortedBySelection()) {
            this.sort();
            this.raise({ type: CollectionViewChangeType.Reorder });
        }

        this._selectedChanged.raise({ type: CollectionViewChangeType.Remove, items: selected });
    }

    selectAll() {
        let selected = this._selected;
        let change: Box<T>[] = [];

        for (let box of this._array) {
            if (!selected.has(box)) {
                selected.add(box);
                change.push(box);
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
        if (first != null) {
            this.setSingleSelected(first);
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

        let comp: (left: Box<T>, right: Box<T>) => number;

        if (sortSpecifications.length === 1) {
            comp = this.buildComparator(sortSpecifications[0]);
        } else {
            let comps: ((left: Box<T>, right: Box<T>) => number)[] = [];
            for (let i = 0; i < sortSpecifications.length; i++) {
                let sortSpecification = sortSpecifications[i];
                comps.push(this.buildComparator(sortSpecification));
            }

            comp = ((left: Box<T>, right: Box<T>): number => {
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

    selectedComparatorBuilder(): (left: Box<T>, right: Box<T>) => number {
        let selected = this._selected;

        return ((left: Box<T>, right: Box<T>): number => {
            let leftSelected = selected.has(left);
            let rightSelected = selected.has(right);

            if (leftSelected === rightSelected) {
                return 0;
            } else if (leftSelected) {
                return 1;
            } else {
                return -1;
            }
        });
    }

    private buildComparator(sortSpecification: SortSpecification<T>): (left: Box<T>, right: Box<T>) => number {
        let comp: (left: Box<T>, right: Box<T>) => number;

        if (sortSpecification.ascendingComparator != null) {
            let valueComp = sortSpecification.ascendingComparator;

            comp = ((left: Box<T>, right: Box<T>) => {
                return valueComp(left.value, right.value);
            });
        }
        else if (sortSpecification.ascendingBoxComparator != null) {
            comp = sortSpecification.ascendingBoxComparator;
        }
        else if (sortSpecification.property) {
            let property = sortSpecification.property;

            let valueComp = ((left, right) => {
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

            comp = ((left: Box<T>, right: Box<T>) => {
                return valueComp(left.value, right.value);
            });
        } else {
            let valueComp = ((left, right) => {
                if (left === right) {
                    return 0;
                } else if (left > right) {
                    return 1;
                } else {
                    return -1;
                }
            });

            comp = ((left: Box<T>, right: Box<T>) => {
                return valueComp(left.value, right.value);
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

        this._predicate = CollectionView.buildPredicate(filterSpecifications);

        this.doReset();
        this.sort();
        this.raise({ type: CollectionViewChangeType.Reset });
        this._filterSpecifications.raise(filterSpecifications);
    }

    private static buildPredicate<T>(filterSpecifications: FilterSpecifications<T>[]): (value: Box<T>) => boolean {
        if (filterSpecifications.length === 0 || filterSpecifications[0] == null) {
            return undefined;
        }

        let predicates = [...IterableHelper.map(filterSpecifications.values(), f => {
            if (f.boxPredicate) {
                return f.boxPredicate;
            }

            let p = f.predicate;
            if (p) {
                return (item: Box<T>) => p(item.value);
            }

            return () => true;
        })];

        return ((item: Box<T>) => {
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

        let iterator = (items == null)
            ? this._source.values()
            : items.values();

        let filter = this._predicate;
        if (filter != null) {
            if (this._keySelector === undefined) {
                for (let item of iterator) {
                    let box = new Box(item);
                    if (filter(box)) {
                        this._array.push(box);
                    }
                }
            } else {
                let map = this._map;
                map.clear();

                for (let item of iterator) {
                    let key = this._keySelector(item);
                    let box = new Box(item);
                    if (filter(box)) {
                        this._map.set(key, box);
                        this._array.push(box);
                    }
                }
            }
        } else {
            if (this._keySelector === undefined) {
                for (let item of iterator) {
                    let box = new Box(item);
                    this._array.push(box);
                }
            } else {
                let map = this._map;
                map.clear();

                for (let item of iterator) {
                    let key = this._keySelector(item);
                    let box = new Box(item);
                    this._map.set(key, box);
                    this._array.push(box);
                }
            }
        }

        let selected = this._selected;
        if (selected.size > 0) {
            this._selected.clear();
            return true;
        }

        return false;
    }

    private doAdd(items: T[]): [Box<T>[], Box<T>[]] {
        let added: Box<T>[] = [];
        let removed: Box<T>[] = [];

        if (items == null) {
            return [added, removed];
        }

        let array = this._array;
        let keySelector = this._keySelector;
        let filter = this._predicate;

        if (keySelector === undefined) {
            if (filter == null) {
                for (let item of items) {
                    let box = new Box(item);

                    array.push(box);
                    added.push(box);
                }
            } else {
                for (let item of items) {
                    let box = new Box(item);

                    if (filter(box)) {
                        array.push(box);
                        added.push(box);
                    }
                }
            }

            return [added, removed];
        }

        let map = this._map;

        if (filter == null) {
            for (let item of items) {
                let key = keySelector(item);

                let box = map.get(key);
                if (box == null) {
                    box = new Box(item);
                    map.set(key, box);
                    array.push(box);
                } else {
                    box.value = item;
                }

                added.push(box);
            }

            return [added, removed];
        }

        for (let item of items) {
            let key = keySelector(item);

            let box = map.get(key);
            if (box == null) {
                box = new Box(item);

                if (filter(box)) {
                    map.set(key, box);
                    array.push(box);
                    added.push(box);
                }
            } else {
                box.value = item;

                if (filter(box)) {
                    added.push(box);
                } else {
                    map.delete(key);
                    ArrayHelper.remove(array, box);
                    removed.push(box);
                }
            }
        }

        return [added, removed];
    }

    private doRemove(items: T[]): { removed: Box<T>[], selectedRemoved: Box<T>[] } {
        let removed: Box<T>[] = [];
        let array = this._array;
        let keySelector = this._keySelector;
        let selectedRemoved: Box<T>[] = [];

        if (keySelector === undefined) {
            for (let i = 0; i < items.length; i++) {
                let item = items[i];

                for (let i = 0; i < array.length; i++) {
                    let box = array[i];
                    if (box.value === item) {
                        array.splice(i, 1);
                        removed.push(box);

                        if (this._selected.delete(box)) {
                            selectedRemoved.push(box);
                        }

                        break;
                    }
                }
            }
        }
        else {
            let map = this._map;

            for (let i = 0; i < items.length; i++) {
                let item = items[i];
                let key = keySelector(item);

                let box = map.get(key);
                if (box) {
                    map.delete(key);
                    ArrayHelper.remove(array, box);
                    removed.push(box);

                    if (this._selected.delete(box)) {
                        selectedRemoved.push(box);
                    }
                }
            }
        }

        return { removed, selectedRemoved };
    }

    private doAddAndRemovedSortAndRaise(added: Box<T>[], removed: Box<T>[]): void {
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
}