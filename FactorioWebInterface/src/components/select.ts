import "./select.ts.less";
import { ObservableCollection } from "../utils/observableCollection";
import { CollectionView, CollectionViewChangeType, CollectionViewChangedData } from "../utils/collectionView";
import { Box } from "../utils/box";
import { EventListener } from "../utils/eventListener";
import { IterableHelper } from "../utils/iterableHelper";

export class Option<T> extends HTMLOptionElement {
    box: Box<T>;

    get item(): T {
        return this.box.value;
    }
}

customElements.define('a-option', Option, { extends: 'option' });

export class Select<T = any> extends HTMLElement {
    private _select: HTMLSelectElement;

    private _source: CollectionView<T>;
    private _optionBuilder: (item: T) => string | Option<T>;
    private _optionMap: Map<Box<T>, HTMLOptionElement>;

    get value(): string {
        return this._select.value;
    }

    get selectedBox(): Box<T> {
        let option = this._select.selectedOptions[0] as Option<T>;
        return option?.box;
    }

    get selectedItem(): T {
        return this.selectedBox?.value;
    }

    get options(): HTMLOptionsCollection {
        return this._select.options;
    }

    constructor(source?: T[] | ObservableCollection<T> | CollectionView<T>, optionBuilder?: (item: T) => string | Option<T>) {
        super();

        this._select = document.createElement('select');
        this.append(this._select);

        this._optionBuilder = optionBuilder || ((item) => '' + item);

        if (source instanceof ObservableCollection) {
            this._source = new CollectionView(source);
        } else if (source instanceof CollectionView) {
            this._source = source;
        }

        if (Array.isArray(source)) {
            let options = this._select.options;

            for (let item of source) {
                let option = this.buildOptionElement(new Box(item));
                options.add(option);
            }
        }

        if (this._source) {
            this._optionMap = new Map();
            this.buildOptions(this._source.values);

            this._source.subscribe(event => this.update(event));
            this._source.selectedChanged.subscribe(() => this.updateSelected());

            EventListener.onChange(this._select, () => {
                let selectedBox = this.selectedBox;
                this._source.setSingleSelected(selectedBox);
            });

            this.updateSelected();
        }
    }

    private buildOptionElement(item: Box<T>): Option<T> {
        let option = this._optionBuilder(item.value);

        if (typeof option === 'string') {
            let text = option;
            option = new Option<T>();
            option.innerText = text;
        }

        option.box = item;
        return option;
    }

    private buildOptions(items: IterableIterator<Box<T>>) {
        let options = this._select.options;
        let map = this._optionMap;

        for (let item of items) {
            let option = this.buildOptionElement(item);
            map.set(item, option);
            options.add(option);
        }
    }

    private doReset() {
        this._optionMap.clear();
        this._select.options.length = 0;

        this.buildOptions(this._source.values);
    }

    private doReorder() {
        let options = this._select.options;
        let optionMap = this._optionMap;

        options.length = 0;

        for (let item of this._source.values) {
            let option = optionMap.get(item);
            options.add(option);
        }
    }

    private doUpdate(items: Box<T>[]) {
        let optionMap = this._optionMap;

        for (let item of items) {
            let option = this.buildOptionElement(item);
            optionMap.set(item, option);
        }
    }

    private doRemove(items: Box<T>[]) {
        let optionMap = this._optionMap;

        for (let item of items) {
            let option = optionMap.get(item);
            if (option !== undefined) {
                optionMap.delete(item);
                option.remove();
            }
        }
    }

    update(collectionChangedData: CollectionViewChangedData<T>): void {
        switch (collectionChangedData.type) {
            case CollectionViewChangeType.Reset:
                this.doReset();
                break;
            case CollectionViewChangeType.Reorder:
                this.doReorder();
                break;
            case CollectionViewChangeType.Add:
                this.doUpdate(collectionChangedData.items);
                break;
            case CollectionViewChangeType.Remove:
                this.doRemove(collectionChangedData.items);
                break;
            default:
                break;
        }
    }

    private updateSelected() {
        let box = IterableHelper.firstOrDefault(this._source.selected);

        if (box == this.selectedBox) {
            return;
        }

        if (box == null) {
            this._select.selectedIndex = -1;
            return;
        }

        let option = this._optionMap.get(box);
        if (option == null) {
            this._select.selectedIndex = -1;
            return;
        }

        option.selected = true;
    }
}

customElements.define('a-select', Select);