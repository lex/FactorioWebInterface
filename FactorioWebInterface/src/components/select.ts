import "./select.ts.less";
import { ObservableCollection } from "../utils/observableCollection";
import { CollectionView, CollectionViewChangeType, CollectionViewChangedData } from "../utils/collectionView";
import { Box } from "../utils/box";
import { EventListener } from "../utils/eventListener";
import { IterableHelper } from "../utils/iterableHelper";
import { Icon } from "./icon";
import { Placeholder } from "./placeholder";
import { BaseElement } from "./baseElement";
import { IBindingSource } from "../utils/bindingSource";
import { DelegateBindingTarget, ObjectBindingTarget } from "../utils/bindingTarget";
import { Binding } from "../utils/binding";

export class Option<T> extends HTMLOptionElement {
    box: Box<T>;

    get item(): T {
        return this.box.value;
    }
}

customElements.define('a-option', Option, { extends: 'option' });

export class Select<T = any> extends BaseElement {
    static readonly bindingKeys = {
        placeholder: {},
        isLoading: {},
        ...BaseElement.bindingKeys
    };

    private _select: HTMLSelectElement;

    private _source: CollectionView<T>;
    private _optionBuilder: (item: T) => string | Option<T>;
    private _optionMap: Map<Box<T>, HTMLOptionElement>;

    private _icon: Icon;
    private _placeholder: Placeholder;

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

    get selectedIndex(): number {
        return this._select.selectedIndex;
    }
    set selectedIndex(value: number) {
        let option = this._select.options[value] as Option<T>;
        if (option == null) {
            return;
        }

        if (this._source) {
            this._source.setSingleSelected(option.box);
            return;
        }

        this._select.selectedIndex = value;
    }

    get icon(): Icon {
        return this._icon;
    }
    set icon(value: Icon) {
        let oldIcon = this.icon;
        if (oldIcon === value) {
            return;
        }

        oldIcon?.remove();

        if (value != null) {
            value.classList.add(Icon.classes.isLeftAbsolute);
            this.append(value);
            this._icon = value;

            this._select.classList.add('has-icon-left');
            this._placeholder?.classList.add('has-icon-left');
        } else {
            this._select.classList.remove('has-icon-left');
            this._placeholder?.classList.remove('has-icon-left');
        }
    }

    get placeholder(): string | Node | Placeholder {
        return this._placeholder;
    }
    set placeholder(value: string | Node | Placeholder) {
        let old = this._placeholder;
        if (old === value) {
            return;
        }

        old?.remove();

        if (value == null) {
            return;
        }

        let placeholder = Placeholder.toPlaceholder(value);

        placeholder.classList.toggle('has-icon-left', this.icon != null);
        this._placeholder = placeholder;
        this.addPlaceHolder();
    }

    get isLoading(): boolean {
        return this.classList.contains('is-loading');
    }

    set isLoading(value: boolean) {
        this.classList.toggle('is-loading', value);
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

            EventListener.onChange(this._select, () => {
                if (this._select.selectedIndex >= 0) {
                    this.removePlaceholder();
                } else {
                    this.addPlaceHolder();
                }
            });
        }

        if (this._source) {
            this._optionMap = new Map();
            this.buildOptions(this._source.values());

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

    setIcon(icon: Icon): this {
        this.icon = icon;
        return this;
    }

    setPlaceholder(value: string | Node | Placeholder): this {
        this.placeholder = value;
        return this;
    }

    bindPlaceholder(source: IBindingSource<string | Node | Placeholder>): this {
        let target = new ObjectBindingTarget(this, 'placeholder');
        let binding = new Binding(target, source);

        this.setBinding(Select.bindingKeys.placeholder, binding);
        return this;
    }

    setIsLoading(value: boolean): this {
        this.isLoading = value;
        return this;
    }

    bindIsLoading(source: IBindingSource<boolean>): this {
        let target = new ObjectBindingTarget(this, 'isLoading');
        let binding = new Binding(target, source);

        this.setBinding(Select.bindingKeys.isLoading, binding);
        return this;
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

        this.buildOptions(this._source.values());

        this._select.selectedIndex = -1;
        this.updateSelected();
    }

    private doReorder() {
        let options = this._select.options;
        let optionMap = this._optionMap;

        let option = this._select.selectedOptions[0] as Option<T>;
        options.length = 0;

        for (let item of this._source) {
            let option = optionMap.get(item);
            options.add(option);
        }

        if (option != null) {
            option.selected = true;
        } else {
            this._select.selectedIndex = -1;
        }
    }

    private doUpdate(items: Box<T>[]) {
        let options = this._select.options;
        let optionMap = this._optionMap;

        for (let item of items) {
            let option = optionMap.get(item);

            if (option != null) {
                let newOption = this.buildOptionElement(item);
                options[option.index] = newOption;
                optionMap.set(item, newOption);
            } else {
                option = this.buildOptionElement(item);
                optionMap.set(item, option);
                options.add(option);
            }
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
            if (box == null) {
                this.addPlaceHolder();
            } else {
                this.removePlaceholder();
            }
            return;
        }

        if (box == null) {
            this._select.selectedIndex = -1;
            this.addPlaceHolder();
            return;
        }

        let option = this._optionMap.get(box);
        if (option == null) {
            this._select.selectedIndex = -1;
            this.addPlaceHolder();
            return;
        }

        option.selected = true;
        this.removePlaceholder();
    }

    private removePlaceholder(): void {
        this._placeholder?.remove();
    }

    private addPlaceHolder(): void {
        if (this._placeholder == null || this._placeholder.parentElement === this) {
            return;
        }

        this.append(this._placeholder);
    }
}

customElements.define('a-select', Select);