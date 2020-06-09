import "./select.ts.less";
import { ObservableCollection } from "../utils/observableCollection";
import { CollectionView, CollectionViewChangeType } from "../utils/collectionView";
import { Box } from "../utils/box";
import { EventListener } from "../utils/eventListener";
import { IterableHelper } from "../utils/iterableHelper";
export class Option extends HTMLOptionElement {
    get item() {
        return this.box.value;
    }
}
customElements.define('a-option', Option, { extends: 'option' });
export class Select extends HTMLElement {
    constructor(source, optionBuilder) {
        super();
        this._select = document.createElement('select');
        this.append(this._select);
        this._optionBuilder = optionBuilder || ((item) => '' + item);
        if (source instanceof ObservableCollection) {
            this._source = new CollectionView(source);
        }
        else if (source instanceof CollectionView) {
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
            this._select.selectedIndex = -1;
            this.updateSelected();
        }
    }
    get value() {
        return this._select.value;
    }
    get selectedBox() {
        let option = this._select.selectedOptions[0];
        return option === null || option === void 0 ? void 0 : option.box;
    }
    get selectedItem() {
        var _a;
        return (_a = this.selectedBox) === null || _a === void 0 ? void 0 : _a.value;
    }
    get options() {
        return this._select.options;
    }
    get selectedIndex() {
        return this._select.selectedIndex;
    }
    set selectedIndex(value) {
        let option = this._select.options[value];
        if (option == null) {
            return;
        }
        if (this._source) {
            this._source.setSingleSelected(option.box);
            return;
        }
        this._select.selectedIndex = value;
    }
    buildOptionElement(item) {
        let option = this._optionBuilder(item.value);
        if (typeof option === 'string') {
            let text = option;
            option = new Option();
            option.innerText = text;
        }
        option.box = item;
        return option;
    }
    buildOptions(items) {
        let options = this._select.options;
        let map = this._optionMap;
        for (let item of items) {
            let option = this.buildOptionElement(item);
            map.set(item, option);
            options.add(option);
        }
    }
    doReset() {
        this._optionMap.clear();
        this._select.options.length = 0;
        this.buildOptions(this._source.values);
    }
    doReorder() {
        let options = this._select.options;
        let optionMap = this._optionMap;
        options.length = 0;
        for (let item of this._source.values) {
            let option = optionMap.get(item);
            options.add(option);
        }
    }
    doUpdate(items) {
        let options = this._select.options;
        let optionMap = this._optionMap;
        for (let item of items) {
            let option = optionMap.get(item);
            if (option != null) {
                let newOption = this.buildOptionElement(item);
                options.add(newOption, option);
                option.remove();
                optionMap.set(item, newOption);
            }
            else {
                option = this.buildOptionElement(item);
                optionMap.set(item, option);
                options.add(option);
            }
        }
    }
    doRemove(items) {
        let optionMap = this._optionMap;
        for (let item of items) {
            let option = optionMap.get(item);
            if (option !== undefined) {
                optionMap.delete(item);
                option.remove();
            }
        }
    }
    update(collectionChangedData) {
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
    updateSelected() {
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
//# sourceMappingURL=select.js.map