import { ObservableErrors } from "../utilsOld/ObservableErrors";
import { Observable } from "../utilsOld/observable";
import { Container } from "./container";
export class Form extends Container {
    constructor(_context, fields) {
        super();
        this._context = _context;
        this._fieldMap = new Map();
        this._form = document.createElement('form');
        this._form.classList.add('box');
        for (var i = 0; i < fields.length; i++) {
            let field = fields[i];
            this._fieldMap.set(field.property, field);
            field.onChange(() => {
                _context[field.property] = field.value;
            });
            this.appendChild(field);
        }
    }
    get root() {
        return this._form;
    }
    attachOverride() {
        for (let field of this._fieldMap.values()) {
            field.value = this._context[field.property];
            field.attach();
        }
        this._contextPropertyChangedSubscription = this._context.propertyChanged((obj, propName) => {
            if (propName === '') {
                for (let field of this._fieldMap.values()) {
                    field.value = obj[field.property];
                }
                return;
            }
            let field = this._fieldMap.get(propName);
            if (!field) {
                return;
            }
            field.value = obj[propName];
        });
        if (!ObservableErrors.isType(this._context)) {
            return;
        }
        this._contextErrorChangedSubscription = this._context.errors.errorChanged((obj, propName) => {
            if (propName === '') {
                for (let field of this._fieldMap.values()) {
                    field.valid = obj.getError(field.property);
                }
                return;
            }
            let field = this._fieldMap.get(propName);
            if (!field) {
                return;
            }
            field.valid = obj.getError(field.property);
        });
    }
    dettachOverride() {
        for (let field of this._fieldMap.values()) {
            field.dettach();
        }
        Observable.unSubscribe(this._contextPropertyChangedSubscription);
        Observable.unSubscribe(this._contextErrorChangedSubscription);
    }
    notifyRootChanged(component, oldRoot) {
        throw new Error("Method not implemented.");
    }
}
//# sourceMappingURL=form.js.map