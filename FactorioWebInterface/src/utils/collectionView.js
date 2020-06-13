import { ObservableKeyCollection } from "./observableCollection";
import { Box } from "./box";
import { CollectionChangeType } from "../ts/utils";
import { ArrayHelper } from "./arrayHelper";
import { Observable } from "./observable";
export var CollectionViewChangeType;
(function (CollectionViewChangeType) {
    CollectionViewChangeType["Reset"] = "Reset";
    CollectionViewChangeType["Reorder"] = "Reorder";
    CollectionViewChangeType["Remove"] = "Remove";
    CollectionViewChangeType["Add"] = "Add";
})(CollectionViewChangeType || (CollectionViewChangeType = {}));
export class CollectionView extends Observable {
    constructor(source, keySelector) {
        super();
        this._sortSpecifications = [];
        this._sortChanged = new Observable();
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
    get selectedSortId() {
        return CollectionView.selectedSortId;
    }
    get values() {
        return this._array.values();
    }
    get selected() {
        return this._selected.values();
    }
    get selectedCount() {
        return this._selected.size;
    }
    get viewableSelected() {
        let iterator = this._selected.values();
        if (this._filter == null) {
            return iterator;
        }
        return CollectionView.where(iterator, this._filter);
    }
    get selectedChanged() {
        return this._selectedChanged;
    }
    get sortSpecifications() {
        return this._sortSpecifications;
    }
    getBoxByKey(key) {
        var _a;
        return (_a = this._map) === null || _a === void 0 ? void 0 : _a.get(key);
    }
    getBoxByItem(item) {
        if (this._keySelector === undefined) {
            let array = this._array;
            for (let i = 0; i < array.length; i++) {
                let box = array[i];
                if (box.value === item) {
                    return box;
                }
            }
        }
        else {
            let key = this._keySelector(item);
            return this._map.get(key);
        }
    }
    isSelected(box) {
        return this._selected.has(box);
    }
    setSingleSelected(item) {
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
            let removed = [...CollectionView.where(oldSelected, x => x !== item)];
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
        let removed = [...oldSelected];
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
    setSelected(item, selected) {
        if (selected) {
            if (this._selected.has(item)) {
                return;
            }
            this._selected.add(item);
        }
        else {
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
        let change = [];
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
    setFirstSingleSelected() {
        let first = this._array[0];
        if (first != null) {
            this.setSingleSelected(first);
        }
    }
    sortChanged(callback) {
        return this._sortChanged.subscribe(callback);
    }
    sortBy(sortSpecifications) {
        if (!Array.isArray(sortSpecifications)) {
            sortSpecifications = [sortSpecifications];
        }
        if (sortSpecifications.length === 0 || sortSpecifications[0] == null) {
            this._comparator = undefined;
            this._sortChanged.raise([]);
            return;
        }
        let comp;
        if (sortSpecifications.length === 1) {
            comp = this.buildComparator(sortSpecifications[0]);
        }
        else {
            let comps = [];
            for (let i = 0; i < sortSpecifications.length; i++) {
                let sortSpecification = sortSpecifications[i];
                comps.push(this.buildComparator(sortSpecification));
            }
            comp = ((left, right) => {
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
        this._sortSpecifications = sortSpecifications;
        this._sortChanged.raise(sortSpecifications);
        this.sort();
        this.raise({ type: CollectionViewChangeType.Reorder });
    }
    selectedComparatorBuilder() {
        let selected = this._selected;
        return ((left, right) => {
            let leftSelected = selected.has(left);
            let rightSelected = selected.has(right);
            if (leftSelected === rightSelected) {
                return 0;
            }
            else if (leftSelected) {
                return 1;
            }
            else {
                return -1;
            }
        });
    }
    filterBy(predicate) {
        this._filter = predicate;
        this.doReset();
        this.sort();
        this.raise({ type: CollectionViewChangeType.Reset });
    }
    buildComparator(sortSpecification) {
        let comp;
        if (sortSpecification.ascendingComparator != null) {
            let valueComp = sortSpecification.ascendingComparator;
            comp = ((left, right) => {
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
                }
                else if (left > right) {
                    return 1;
                }
                else {
                    return -1;
                }
            });
            comp = ((left, right) => {
                return valueComp(left.value, right.value);
            });
        }
        else {
            let valueComp = ((left, right) => {
                if (left === right) {
                    return 0;
                }
                else if (left > right) {
                    return 1;
                }
                else {
                    return -1;
                }
            });
            comp = ((left, right) => {
                return valueComp(left.value, right.value);
            });
        }
        if (sortSpecification.ascending === false) {
            let oldComp = comp;
            comp = (left, right) => oldComp(right, left);
        }
        return comp;
    }
    update(changeData) {
        switch (changeData.Type) {
            case CollectionChangeType.Reset:
                let selectedRemoved = this.doReset(changeData.NewItems);
                this.sort();
                this.raise({ type: CollectionViewChangeType.Reset });
                if (selectedRemoved) {
                    this._selectedChanged.raise({ type: CollectionViewChangeType.Reset, items: [] });
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
    doReset(items) {
        let array = this._array;
        array.length = 0;
        let iterator = (items == null)
            ? this._source.values()
            : items.values();
        let filter = this._filter;
        if (filter != null) {
            iterator = CollectionView.where(iterator, filter);
        }
        if (this._keySelector === undefined) {
            for (let item of iterator) {
                let box = new Box(item);
                this._array.push(box);
            }
        }
        else {
            let map = this._map;
            map.clear();
            for (let item of iterator) {
                let key = this._keySelector(item);
                let box = new Box(item);
                this._map.set(key, box);
                this._array.push(box);
            }
        }
        let selected = this._selected;
        if (selected.size > 0) {
            this._selected.clear();
            return true;
        }
        return false;
    }
    doAdd(items) {
        let added = [];
        let removed = [];
        let array = this._array;
        let keySelector = this._keySelector;
        let filter = this._filter;
        if (keySelector === undefined) {
            let iterable = items.values();
            if (this._filter != null) {
                iterable = CollectionView.where(iterable, this._filter);
            }
            for (let item of iterable) {
                let box = new Box(item);
                array.push(box);
                added.push(box);
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
                }
                else {
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
                if (filter(item)) {
                    box = new Box(item);
                    map.set(key, box);
                    array.push(box);
                    added.push(box);
                }
            }
            else {
                if (filter(item)) {
                    box.value = item;
                    added.push(box);
                }
                else {
                    map.delete(key);
                    ArrayHelper.remove(array, box);
                    removed.push(box);
                }
            }
        }
        return [added, removed];
    }
    doRemove(items) {
        let removed = [];
        let array = this._array;
        let keySelector = this._keySelector;
        let selectedRemoved = [];
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
    doAddAndRemovedSortAndRaise(added, removed) {
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
    sort() {
        let comparator = this._comparator;
        if (comparator == null) {
            return;
        }
        this._array.sort(comparator);
    }
    isSortedBySelection() {
        for (let sortSpecification of this._sortSpecifications) {
            if (sortSpecification.sortId === this.selectedSortId) {
                return true;
            }
        }
        return false;
    }
    static *where(it, predicate) {
        for (let item of it) {
            if (predicate(item)) {
                yield item;
            }
        }
    }
}
CollectionView.selectedSortId = {};
//# sourceMappingURL=collectionView.js.map