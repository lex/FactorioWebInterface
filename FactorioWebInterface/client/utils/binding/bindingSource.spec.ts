import { ReadonlyObservablePropertyBindingSource, DelegateBindingTarget } from "./module";
import { ObservableProperty } from "../observableProperty";
import { strict } from "assert";
import { ObservableObject } from "../observableObject";
import { ObservableObjectBindingSource } from "./bindingSource";

describe('BindingSource', function () {
    describe('ReadonlyObservablePropertyBindingSource', function () {
        it('get value', function () {
            // Arrange.
            let property = new ObservableProperty('value');
            let source = new ReadonlyObservablePropertyBindingSource(property);

            // Act.
            let value = source.get();

            // Assert.
            strict.equal(value, 'value');
        });

        it('set does not change value', function () {
            // Arrange.
            let property = new ObservableProperty('value');
            let source = new ReadonlyObservablePropertyBindingSource(property);

            // Act.
            let value = source.set('new value');

            // Assert.
            strict.equal(property.value, 'value');
        });

        it('connected sets binding target', function () {
            // Arrange.
            let property = new ObservableProperty('value');

            let setValue;
            let target = new DelegateBindingTarget(v => setValue = v);

            let source = new ReadonlyObservablePropertyBindingSource(property);

            // Act.
            source.connected(target);

            // Assert.
            strict.equal(setValue, 'value');
        });

        it('connected subscribes to change', function () {
            // Arrange.
            let property = new ObservableProperty('value');

            let setValue;
            let target = new DelegateBindingTarget(v => setValue = v);

            let source = new ReadonlyObservablePropertyBindingSource(property);
            source.connected(target);

            // Act.
            property.raise('new value');

            // Assert.
            strict.equal(setValue, 'new value');
        });

        it('disconnected stops subscribes to change', function () {
            // Arrange.
            let property = new ObservableProperty('value');

            let setValue;
            let target = new DelegateBindingTarget(v => setValue = v);

            let source = new ReadonlyObservablePropertyBindingSource(property);
            source.connected(target);

            property.raise('after connect');

            source.disconnected(target);

            // Act.
            property.raise('after disconnect');

            // Assert.
            strict.equal(setValue, 'after connect');
        });
    });

    describe('ObservableObjectBindingSource', function () {
        class MockObservableObject extends ObservableObject {
            private _property = '';

            get property(): string {
                return this._property;
            }

            set property(value: string) {
                this._property = value;
                this.raise('property', value);
            }
        }

        it('get value', function () {
            // Arrange.
            let observableObject = new MockObservableObject();
            observableObject.property = 'value';

            let source = new ObservableObjectBindingSource(observableObject, 'property');

            // Act.
            let value = source.get();

            // Assert.
            strict.equal(value, 'value');
        });

        it('set value', function () {
            // Arrange.
            let observableObject = new MockObservableObject();
            observableObject.property = 'value';

            let source = new ObservableObjectBindingSource(observableObject, 'property');

            // Act.
            let value = source.set('new value');

            // Assert.
            strict.equal(observableObject.property, 'new value');
        });

        it('connected sets binding target', function () {
            // Arrange.
            let observableObject = new MockObservableObject();
            observableObject.property = 'value';

            let setValue;
            let target = new DelegateBindingTarget(v => setValue = v);

            let source = new ObservableObjectBindingSource(observableObject, 'property');

            // Act.
            source.connected(target);

            // Assert.
            strict.equal(setValue, 'value');
        });

        it('connected subscribes to change', function () {
            // Arrange.
            let observableObject = new MockObservableObject();
            observableObject.property = 'value';

            let setValue;
            let target = new DelegateBindingTarget(v => setValue = v);

            let source = new ObservableObjectBindingSource(observableObject, 'property');
            source.connected(target);

            // Act.
            observableObject.property = 'new value';

            // Assert.
            strict.equal(setValue, 'new value');
        });

        it('disconnected stops subscribes to change', function () {
            // Arrange.
            let observableObject = new MockObservableObject();
            observableObject.property = 'value';

            let setValue;
            let target = new DelegateBindingTarget(v => setValue = v);

            let source = new ObservableObjectBindingSource(observableObject, 'property');
            source.connected(target);

            observableObject.property = 'after connect';

            source.disconnected(target);

            // Act.
            observableObject.property = 'after disconnect';

            // Assert.
            strict.equal(setValue, 'after connect');
        });
    });
});