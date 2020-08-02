import { ObservableKeyArray } from "./module";
import { CollectionChangeType, CollectionChangedData } from "../../ts/utils";
import { strict } from "assert";

describe('ObservableKeyArray', function () {
    describe('update', function () {
        it('reset no items', function () {
            // Arrange.
            let observableKeyArray = new ObservableKeyArray<number, number>(x => x);

            let actaulEvents: CollectionChangedData<number>[] = [];
            observableKeyArray.subscribe(event => actaulEvents.push(event));

            // Act.
            observableKeyArray.update({ Type: CollectionChangeType.Reset });

            // Assert.
            strict.deepEqual([...observableKeyArray.values()], []);
            strict.equal(actaulEvents.length, 1);
            strict.equal(actaulEvents[0].Type, CollectionChangeType.Reset);
            strict.equal(actaulEvents[0].NewItems, undefined);
        });

        it('reset with items', function () {
            // Arrange.
            let observableKeyArray = new ObservableKeyArray<number, number>(x => x);

            let actaulEvents: CollectionChangedData<number>[] = [];
            observableKeyArray.subscribe(event => actaulEvents.push(event));

            // Act.
            observableKeyArray.update({ Type: CollectionChangeType.Reset, NewItems: [1, 2, 3] });

            // Assert.
            strict.deepEqual([...observableKeyArray.values()], [1, 2, 3]);
            strict.equal(actaulEvents.length, 1);
            strict.equal(actaulEvents[0].Type, CollectionChangeType.Reset);
            strict.equal(actaulEvents[0].NewItems, undefined);
        });

        it('reset with duplicate items', function () {
            // Arrange.
            let observableKeyArray = new ObservableKeyArray<number, number>(x => x);

            let actaulEvents: CollectionChangedData<number>[] = [];
            observableKeyArray.subscribe(event => actaulEvents.push(event));

            // Act.
            observableKeyArray.update({ Type: CollectionChangeType.Reset, NewItems: [1, 2, 2, 2, 3] });

            // Assert.
            strict.deepEqual([...observableKeyArray.values()], [1, 2, 3]);
            strict.equal(actaulEvents.length, 1);
            strict.equal(actaulEvents[0].Type, CollectionChangeType.Reset);
            strict.equal(actaulEvents[0].NewItems, undefined);
        });

        it('add no items', function () {
            // Arrange.
            let observableKeyArray = new ObservableKeyArray<number, number>(x => x);

            let actaulEvents: CollectionChangedData<number>[] = [];
            observableKeyArray.subscribe(event => actaulEvents.push(event));

            // Act.
            observableKeyArray.update({ Type: CollectionChangeType.Add, NewItems: [] });

            // Assert.
            strict.deepEqual([...observableKeyArray.values()], []);
            strict.equal(actaulEvents.length, 0);
        });

        it('add items', function () {
            // Arrange.
            let observableKeyArray = new ObservableKeyArray<number, number>(x => x);

            let actaulEvents: CollectionChangedData<number>[] = [];
            observableKeyArray.subscribe(event => actaulEvents.push(event));

            // Act.
            observableKeyArray.update({ Type: CollectionChangeType.Add, NewItems: [1, 2, 3] });

            // Assert.
            strict.deepEqual([...observableKeyArray.values()], [1, 2, 3]);
            strict.equal(actaulEvents.length, 1);
            strict.equal(actaulEvents[0].Type, CollectionChangeType.Add);
            strict.deepEqual(actaulEvents[0].NewItems, [1, 2, 3]);
        });

        it('add duplicate items', function () {
            // Arrange.
            let observableKeyArray = new ObservableKeyArray<number, number>(x => x);

            let actaulEvents: CollectionChangedData<number>[] = [];
            observableKeyArray.subscribe(event => actaulEvents.push(event));

            // Act.
            observableKeyArray.update({ Type: CollectionChangeType.Add, NewItems: [1, 2, 2, 2, 3] });

            // Assert.
            strict.deepEqual([...observableKeyArray.values()], [1, 2, 3]);
            strict.equal(actaulEvents.length, 1);
            strict.equal(actaulEvents[0].Type, CollectionChangeType.Add);
            strict.deepEqual(actaulEvents[0].NewItems, [1, 2, 3]);
        });

        it('add duplicate items when already items in collection', function () {
            // Arrange.
            let observableKeyArray = new ObservableKeyArray<number, number>(x => x);
            observableKeyArray.add(1, 2, 3);

            let actaulEvents: CollectionChangedData<number>[] = [];
            observableKeyArray.subscribe(event => actaulEvents.push(event));

            // Act.
            observableKeyArray.update({ Type: CollectionChangeType.Add, NewItems: [1, 2, 2, 2, 3] });

            // Assert.
            strict.deepEqual([...observableKeyArray.values()], [1, 2, 3]);
            strict.equal(actaulEvents.length, 1);
            strict.equal(actaulEvents[0].Type, CollectionChangeType.Add);
            strict.deepEqual(actaulEvents[0].NewItems, [1, 2, 3]);
        });

        it('remove no items', function () {
            // Arrange.
            let observableKeyArray = new ObservableKeyArray<number, number>(x => x);
            observableKeyArray.add(1, 2, 3);

            let actaulEvents: CollectionChangedData<number>[] = [];
            observableKeyArray.subscribe(event => actaulEvents.push(event));

            // Act.
            observableKeyArray.update({ Type: CollectionChangeType.Remove, OldItems: [] });

            // Assert.
            strict.deepEqual([...observableKeyArray.values()], [1, 2, 3]);
            strict.equal(actaulEvents.length, 0);
        });

        it('remove items', function () {
            // Arrange.
            let observableKeyArray = new ObservableKeyArray<number, number>(x => x);
            observableKeyArray.add(1, 2, 3, 4, 5);

            let actaulEvents: CollectionChangedData<number>[] = [];
            observableKeyArray.subscribe(event => actaulEvents.push(event));

            // Act.
            observableKeyArray.update({ Type: CollectionChangeType.Remove, OldItems: [1, 3, 5] });

            // Assert.
            strict.deepEqual([...observableKeyArray.values()], [2, 4]);
            strict.equal(actaulEvents.length, 1);
            strict.equal(actaulEvents[0].Type, CollectionChangeType.Remove);
            strict.deepEqual(actaulEvents[0].OldItems, [1, 3, 5]);
        });

        it('remove duplicate items', function () {
            // Arrange.
            let observableKeyArray = new ObservableKeyArray<number, number>(x => x);
            observableKeyArray.add(1, 2, 3, 4, 5);

            let actaulEvents: CollectionChangedData<number>[] = [];
            observableKeyArray.subscribe(event => actaulEvents.push(event));

            // Act.
            observableKeyArray.update({ Type: CollectionChangeType.Remove, OldItems: [1, 3, 3, 3, 5] });

            // Assert.
            strict.deepEqual([...observableKeyArray.values()], [2, 4]);
            strict.equal(actaulEvents.length, 1);
            strict.equal(actaulEvents[0].Type, CollectionChangeType.Remove);
            strict.deepEqual(actaulEvents[0].OldItems, [1, 3, 5]);
        });

        it('add and remove items', function () {
            // Arrange.
            let observableKeyArray = new ObservableKeyArray<number, number>(x => x);
            observableKeyArray.add(1, 2, 3, 4, 5);

            let actaulEvents: CollectionChangedData<number>[] = [];
            observableKeyArray.subscribe(event => actaulEvents.push(event));

            // Act.
            observableKeyArray.update({ Type: CollectionChangeType.AddAndRemove, NewItems: [6, 7, 7, 7, 8], OldItems: [1, 3, 3, 3, 5] });

            // Assert.
            strict.deepEqual([...observableKeyArray.values()], [2, 4, 6, 7, 8]);
            strict.equal(actaulEvents.length, 1);
            strict.equal(actaulEvents[0].Type, CollectionChangeType.AddAndRemove);
            strict.deepEqual(actaulEvents[0].NewItems, [6, 7, 8]);
            strict.deepEqual(actaulEvents[0].OldItems, [1, 3, 5]);
        });
    });
});