import { ObservableObject } from "../utils/observableObject";
import { FieldBase } from "./fieldBase";
import { ObservableErrors } from "../utils/observableErrors";
import { BaseElement, Lifecycle } from "./baseElement";
import { VirtualComponent } from "./virtualComponent";
import { StackPanel } from "./stackPanel";
import { NodeHelper } from "../utils/nodeHelper";

export class VirtualForm extends VirtualComponent {
    private subscriptions: (() => void)[] = [];
    private _fields: FieldBase[];

    constructor(private dataContext: ObservableObject, fieldsOrBaseElement?: FieldBase[] | BaseElement) {
        super();

        let parent: BaseElement;

        if (fieldsOrBaseElement == null) {
            parent = new StackPanel(StackPanel.direction.column);
        } else if (Array.isArray(fieldsOrBaseElement)) {
            parent = new StackPanel(StackPanel.direction.column);
            this._fields = fieldsOrBaseElement;
            parent.append(...this._fields);
        } else {
            parent = fieldsOrBaseElement;
            this._fields = NodeHelper.getByInstanceOf(parent, FieldBase);
        }

        parent.onLifecycle(event => this.lifecycle(event));
        this._root = parent;
    }

    set isHorizontal(value: boolean) {
        if (value) {
            for (let field of this._fields) {
                field.classList.add('is-horizontal');
            }
        } else {
            for (let field of this._fields) {
                field.classList.remove('is-horizontal');
            }
        }
    }

    set hideErrors(value: boolean) {
        if (value) {
            for (let field of this._fields) {
                field.classList.add('hide-error');
            }
        }
        else {
            for (let field of this._fields) {
                field.classList.remove('hide-error');
            }
        }
    }

    private lifecycle(event: Lifecycle) {
        switch (event) {
            case 'connectedCallback':
                this.connected();
                return;
            case 'disconnectedCallback':
                this.disconnected();
                return;
            default:
        }
    }

    private connected() {
        for (let field of this._fields) {
            let property = field.property;
            if (property == null) {
                continue;
            }

            field.value = this.dataContext[property];

            let sub = this.dataContext.propertyChanged(property, event => field.value = event);
            this.subscriptions.push(sub);

            let fieldSub = field.onChange(value => this.dataContext[property] = value);
            this.subscriptions.push(fieldSub);
        }

        if (ObservableErrors.isType(this.dataContext)) {
            let errors = this.dataContext.errors;
            for (let field of this._fields) {
                let property = field.property;
                if (property == null) {
                    continue;
                }

                field.error = errors.getError(property).error;

                let subscription = errors.errorChanged(property, event => field.error = event.error);
                this.subscriptions.push(subscription);
            }
        }
    }

    private disconnected() {
        for (let sub of this.subscriptions) {
            sub();
        }

        this.subscriptions.length = 0;
    }
}