import { ObservableKeyArray } from "./ObservableKeyArray";
import { CollectionView, CollectionViewChangeType, CollectionViewChangedData } from "./collectionView";
import { strict } from "assert";
import { CollectionChangeType } from "../../ts/utils";
import { ObservableArray } from "./observableArray";

describe('CollectionView', function () {
    describe('values', function () {
        it('should be empty when created from empty collection.', function () {
            // Arrange.
            let o = new ObservableKeyArray<string, string>(x => x);
            let cv = new CollectionView(o);

            // Act.
            let array = [...cv];

            // Assert.
            strict.equal(array.length, 0);
        });
    });

    describe('selected', function () {
        it('should be empty when created.', function () {
            // Arrange.
            let o = new ObservableKeyArray<string, string>(x => x);
            let cv = new CollectionView(o);

            // Act.
            let selected = [...cv.selected];
            let viewabledSelected = [...cv.viewableSelected];

            // Assert.
            strict.equal(selected.length, 0);
            strict.equal(viewabledSelected.length, 0);
            strict.equal(cv.selectedCount, 0);
        });

        it('should contain item when item is selected.', function () {
            // Arrange.
            let o = new ObservableKeyArray<number, number>(x => x);
            o.add(1, 2, 3);
            let cv = new CollectionView(o);

            let actualEvent: CollectionViewChangedData<number>
            cv.selectedChanged.subscribe(event => actualEvent = event);

            // Act.            
            cv.setSelected(1, true);

            // Assert.
            let selected = [...cv.selected];
            let viewabledSelected = [...cv.viewableSelected];

            strict.equal(selected.length, 1);
            strict.equal(viewabledSelected.length, 1);
            strict.equal(cv.selectedCount, 1);

            strict.equal(selected[0], 1);
            strict.equal(viewabledSelected[0], 1);
            strict.equal(cv.isSelected(1), true);

            strict.equal(actualEvent.type, CollectionViewChangeType.Add);
            strict.deepEqual(actualEvent.items, [1]);
        });

        it('should contain items when items are selected.', function () {
            // Arrange.
            let o = new ObservableKeyArray<number, number>(x => x);
            o.add(1, 2, 3);
            let cv = new CollectionView(o);

            let actualEvent: CollectionViewChangedData<number>
            cv.selectedChanged.subscribe(event => actualEvent = event);

            // Act.            
            cv.setSelected(1, true);

            // Assert Event.
            strict.equal(actualEvent.type, CollectionViewChangeType.Add);
            strict.deepEqual(actualEvent.items, [1]);

            // Act.
            cv.setSelected(2, true);

            // Assert.
            strict.equal(actualEvent.type, CollectionViewChangeType.Add);
            strict.deepEqual(actualEvent.items, [2]);

            let expectedSelected = [1, 2];

            strict.deepEqual([...cv.selected], expectedSelected);
            strict.deepEqual([...cv.viewableSelected], expectedSelected);
            strict.equal(cv.selectedCount, 2);
            strict.equal(cv.isSelected(1), true);
            strict.equal(cv.isSelected(2), true);
        });

        it('select all should select all items.', function () {
            // Arrange.
            let o = new ObservableKeyArray<number, number>(x => x);
            o.add(1, 2, 3);
            let cv = new CollectionView(o);

            let actualEvent: CollectionViewChangedData<number>;
            cv.selectedChanged.subscribe(event => actualEvent = event);

            // Act.            
            cv.selectAll();

            // Assert.
            let expectedSelected = [1, 2, 3];

            strict.deepEqual([...cv.selected], expectedSelected);
            strict.deepEqual([...cv.viewableSelected], expectedSelected);
            strict.equal(cv.selectedCount, 3);
            strict.equal(cv.isSelected(1), true);
            strict.equal(cv.isSelected(2), true);
            strict.equal(cv.isSelected(3), true);

            strict.equal(actualEvent.type, CollectionViewChangeType.Add);
            strict.deepEqual(actualEvent.items, expectedSelected);
        });

        it('unselecting an item removes it from selected items.', function () {
            // Arrange.
            let o = new ObservableKeyArray<number, number>(x => x);
            o.add(1, 2, 3);
            let cv = new CollectionView(o);

            cv.setSelected(1, true);

            strict.equal(cv.isSelected(1), true);

            let actualEvent: CollectionViewChangedData<number>;
            cv.selectedChanged.subscribe(event => actualEvent = event);

            // Act.            
            cv.setSelected(1, false);

            // Assert.
            let expectedSelected = [];
            strict.deepEqual([...cv.selected], expectedSelected);
            strict.deepEqual([...cv.viewableSelected], expectedSelected);
            strict.equal(cv.selectedCount, 0);

            strict.equal(cv.isSelected(1), false);

            strict.equal(actualEvent.type, CollectionViewChangeType.Remove);
            strict.deepEqual(actualEvent.items, [1]);
        });

        it('removing an item removes it from selected items.', function () {
            // Arrange.
            let o = new ObservableKeyArray<number, number>(x => x);
            o.add(1, 2, 3);
            let cv = new CollectionView(o);

            cv.setSelected(1, true);

            strict.equal(cv.isSelected(1), true);

            let actualEvent: CollectionViewChangedData<number>;
            cv.selectedChanged.subscribe(event => actualEvent = event);

            // Act.            
            o.remove(1);

            // Assert.
            let expectedSelected = [];
            strict.deepEqual([...cv.selected], expectedSelected);
            strict.deepEqual([...cv.viewableSelected], expectedSelected);
            strict.equal(cv.selectedCount, 0);

            strict.equal(cv.isSelected(1), false);

            strict.equal(actualEvent.type, CollectionViewChangeType.Remove);
            strict.deepEqual(actualEvent.items, [1]);
        });

        it('removing multiple items removes them from selected items.', function () {
            // Arrange.
            let o = new ObservableKeyArray<number, number>(x => x);
            o.add(1, 2, 3);
            let cv = new CollectionView(o);

            cv.setSelected(1, true);
            cv.setSelected(2, true);

            strict.equal(cv.isSelected(1), true);
            strict.equal(cv.isSelected(2), true);

            let actualEvent: CollectionViewChangedData<number>;
            cv.selectedChanged.subscribe(event => actualEvent = event);

            // Act.            
            o.remove(1, 2);

            // Assert.
            let expectedSelected = [];
            strict.deepEqual([...cv.selected], expectedSelected);
            strict.deepEqual([...cv.viewableSelected], expectedSelected);
            strict.equal(cv.selectedCount, 0);

            strict.equal(cv.isSelected(1), false);
            strict.equal(cv.isSelected(2), false);

            strict.equal(actualEvent.type, CollectionViewChangeType.Remove);
            strict.deepEqual(actualEvent.items, [1, 2]);
        });

        let resetEventTests = [
            { name: 'without new items', arg: { Type: CollectionChangeType.Reset } },
            { name: 'with new items', arg: { Type: CollectionChangeType.Reset, NewItems: [1, 2, 3] } }
        ];

        for (let test of resetEventTests) {
            it(`reset event ${test.name} removes selected items.`, function () {
                // Arrange.
                let o = new ObservableKeyArray<number, number>(x => x);
                o.add(1, 2, 3);
                let cv = new CollectionView(o);

                cv.setSelected(1, true);

                strict.equal(cv.isSelected(1), true);

                let actualEvent: CollectionViewChangedData<number>;
                cv.selectedChanged.subscribe(event => actualEvent = event);

                // Act.            
                o.update(test.arg);

                // Assert.
                let expectedSelected = [];
                strict.deepEqual([...cv.selected], expectedSelected);
                strict.deepEqual([...cv.viewableSelected], expectedSelected);
                strict.equal(cv.selectedCount, 0);

                strict.equal(cv.isSelected(1), false);

                strict.equal(actualEvent.type, CollectionViewChangeType.Reset);
            });

            it(`reset event ${test.name} when no items selected does not raise selected changed.`, function () {
                // Arrange.
                let o = new ObservableKeyArray<number, number>(x => x);
                let cv = new CollectionView(o);

                o.add(1, 2, 3);

                let callbackFiredCount = 0;
                cv.selectedChanged.subscribe(() => callbackFiredCount++);

                strict.equal(cv.isSelected(1), false);
                strict.equal(cv.isSelected(2), false);
                strict.equal(cv.isSelected(3), false);

                // Act.
                o.update(test.arg);

                // Assert.
                strict.equal(callbackFiredCount, 0);
            });

            it(`reset event ${test.name} when items selected does raise selected changed.`, function () {
                // Arrange.
                let o = new ObservableKeyArray<number, number>(x => x);
                let cv = new CollectionView(o);

                o.add(1, 2, 3);

                cv.selectAll();

                let actualEvent: CollectionViewChangedData<number>;
                cv.selectedChanged.subscribe(event => actualEvent = event);

                strict.equal(cv.isSelected(1), true);
                strict.equal(cv.isSelected(2), true);
                strict.equal(cv.isSelected(3), true);

                // Act.
                o.update(test.arg);

                // Assert.                
                strict.deepEqual([...cv.selected], []);
                strict.deepEqual([...cv.viewableSelected], []);
                strict.equal(cv.selectedCount, 0);

                strict.equal(actualEvent.type, CollectionViewChangeType.Reset);
            });
        }

        it('adding item does not raise selected changed.', function () {
            // Arrange.
            let o = new ObservableKeyArray<number, number>(x => x);
            let cv = new CollectionView(o);

            let callbackFiredCount = 0;
            cv.selectedChanged.subscribe(() => callbackFiredCount++);

            // Act add one item.
            o.add(1);

            // Assert.
            strict.equal(callbackFiredCount, 0);

            // Act add two items.
            o.add(2, 3);

            // Assert.
            strict.equal(callbackFiredCount, 0);
        });

        it('removing unselected item does not raise selected changed.', function () {
            // Arrange.
            let o = new ObservableKeyArray<number, number>(x => x);
            let cv = new CollectionView(o);

            o.add(1, 2, 3);

            let callbackFiredCount = 0;
            cv.selectedChanged.subscribe(() => callbackFiredCount++);

            strict.equal(cv.isSelected(1), false);
            strict.equal(cv.isSelected(2), false);
            strict.equal(cv.isSelected(3), false);

            // Act remove one item.
            o.remove(2);

            // Assert.
            strict.equal(callbackFiredCount, 0);

            // Act remove two items.
            o.remove(1, 3);

            // Assert.
            strict.equal(callbackFiredCount, 0);
        });

        describe('setSingleSelected', function () {
            it('select item', function () {
                // Arrange.
                let o = new ObservableKeyArray<number, number>(x => x);
                let cv = new CollectionView(o);

                o.add(1, 2, 3);

                let actualEvents: CollectionViewChangedData<number>[] = [];
                cv.selectedChanged.subscribe(event => actualEvents.push(event));

                let actualSingleSelectedEvents: CollectionViewChangedData<number>[] = [];
                cv.newSingleSelectedChanged.subscribe(event => actualSingleSelectedEvents.push(event));

                // Act.
                cv.setSingleSelected(2);

                // Assert.
                let expectedSelected = [2];

                strict.deepEqual([...cv.selected], expectedSelected);
                strict.deepEqual([...cv.viewableSelected], expectedSelected);
                strict.equal(cv.selectedCount, 1);
                strict.equal(cv.isSelected(1), false);
                strict.equal(cv.isSelected(2), true);
                strict.equal(cv.isSelected(3), false);

                strict.equal(1, actualEvents.length);

                let addEvent = actualEvents[0];
                strict.equal(addEvent.type, CollectionViewChangeType.Add);
                strict.deepEqual(addEvent.items, expectedSelected);

                strict.equal(1, actualSingleSelectedEvents.length);

                let singleSelectedAddEvent = actualSingleSelectedEvents[0];
                strict.equal(singleSelectedAddEvent.type, CollectionViewChangeType.Add);
                strict.deepEqual(singleSelectedAddEvent.items, expectedSelected);
            });

            it('select different item', function () {
                // Arrange.
                let o = new ObservableKeyArray<number, number>(x => x);
                let cv = new CollectionView(o);

                o.add(1, 2, 3);

                cv.setSingleSelected(2);

                let actualEvents: CollectionViewChangedData<number>[] = [];
                cv.selectedChanged.subscribe(event => actualEvents.push(event));

                let actualSingleSelectedEvents: CollectionViewChangedData<number>[] = [];
                cv.newSingleSelectedChanged.subscribe(event => actualSingleSelectedEvents.push(event));

                // Act.
                cv.setSingleSelected(3);

                // Assert.
                let expectedSelected = [3];

                strict.deepEqual([...cv.selected], expectedSelected);
                strict.deepEqual([...cv.viewableSelected], expectedSelected);
                strict.equal(cv.selectedCount, 1);
                strict.equal(cv.isSelected(1), false);
                strict.equal(cv.isSelected(2), false);
                strict.equal(cv.isSelected(3), true);

                strict.equal(2, actualEvents.length);

                let removeEvent = actualEvents[0];
                strict.equal(removeEvent.type, CollectionViewChangeType.Remove);
                strict.deepEqual(removeEvent.items, [2]);

                let addEvent = actualEvents[1];
                strict.equal(addEvent.type, CollectionViewChangeType.Add);
                strict.deepEqual(addEvent.items, expectedSelected);

                strict.equal(1, actualSingleSelectedEvents.length);

                let singleSelectedAddEvent = actualSingleSelectedEvents[0];
                strict.equal(singleSelectedAddEvent.type, CollectionViewChangeType.Add);
                strict.deepEqual(singleSelectedAddEvent.items, expectedSelected);
            });

            it('unselect item', function () {
                // Arrange.
                let o = new ObservableKeyArray<number, number>(x => x);
                let cv = new CollectionView(o);

                o.add(1, 2, 3);

                cv.setSingleSelected(2);

                let actualEvents: CollectionViewChangedData<number>[] = [];
                cv.selectedChanged.subscribe(event => actualEvents.push(event));

                let actualSingleSelectedEvents: CollectionViewChangedData<number>[] = [];
                cv.newSingleSelectedChanged.subscribe(event => actualSingleSelectedEvents.push(event));

                // Act.
                cv.setSingleSelected(null);

                // Assert.
                let expectedSelected = [];

                strict.deepEqual([...cv.selected], expectedSelected);
                strict.deepEqual([...cv.viewableSelected], expectedSelected);
                strict.equal(cv.selectedCount, 0);
                strict.equal(cv.isSelected(1), false);
                strict.equal(cv.isSelected(2), false);
                strict.equal(cv.isSelected(3), false);

                strict.equal(1, actualEvents.length);

                let removeEvent = actualEvents[0];
                strict.equal(removeEvent.type, CollectionViewChangeType.Remove);
                strict.deepEqual(removeEvent.items, [2]);

                strict.equal(1, actualSingleSelectedEvents.length);

                let singleSelectedRemoveEvent = actualSingleSelectedEvents[0];
                strict.equal(singleSelectedRemoveEvent.type, CollectionViewChangeType.Remove);
                strict.deepEqual(singleSelectedRemoveEvent.items, [2]);
            });
        });
    });

    describe('ObservableCollection change event', function () {
        it('when reset new items are added', function () {
            // Arrange.
            let o = new ObservableKeyArray<number, number>(x => x);
            let cv = new CollectionView(o);

            let actualEvents: CollectionViewChangedData<number>[] = [];
            cv.subscribe(event => actualEvents.push(event));

            // Add one item.
            o.update({ Type: CollectionChangeType.Reset, NewItems: [1, 2, 3] });

            strict.deepEqual([...cv], [1, 2, 3]);

            strict.equal(actualEvents.length, 1);
            strict.equal(actualEvents[0].type, CollectionChangeType.Reset);
        });

        it('when reset and key selector duplicate items are not added', function () {
            // Arrange.
            let o = new ObservableArray<number>();
            let cv = new CollectionView(o, x => x);

            let actualEvents: CollectionViewChangedData<number>[] = [];
            cv.subscribe(event => actualEvents.push(event));

            // Add one item.
            o.update({ Type: CollectionChangeType.Reset, NewItems: [1, 1, 2] });

            strict.deepEqual([...cv], [1, 2]);

            strict.equal(actualEvents.length, 1);
            strict.equal(actualEvents[0].type, CollectionChangeType.Reset);
        });

        it('when reset and key selector and filter duplicate items are not added', function () {
            // Arrange.
            let o = new ObservableArray<number>();
            let cv = new CollectionView(o, x => x);
            cv.filterBy({ predicate: () => true });

            let actualEvents: CollectionViewChangedData<number>[] = [];
            cv.subscribe(event => actualEvents.push(event));

            // Add one item.
            o.update({ Type: CollectionChangeType.Reset, NewItems: [1, 1, 2] });

            strict.deepEqual([...cv], [1, 2]);

            strict.equal(actualEvents.length, 1);
            strict.equal(actualEvents[0].type, CollectionChangeType.Reset);
        });

        it('when add items are added.', function () {
            // Arrange.
            let o = new ObservableKeyArray<number, number>(x => x);
            let cv = new CollectionView(o);

            let callbackFiredCount = 0;
            cv.subscribe(() => callbackFiredCount++);

            // Add one item.
            o.add(1);

            strict.deepEqual([...cv], [1]);
            strict.equal(callbackFiredCount, 1);

            // Add two items.
            o.add(2, 3);

            strict.deepEqual([...cv], [1, 2, 3]);
            strict.equal(callbackFiredCount, 2);
        });

        it('when add items and key selector duplicates are not added.', function () {
            // Arrange.
            let o = new ObservableArray<number>();
            let cv = new CollectionView(o, x => x);

            let actualEvents: CollectionViewChangedData<number>[] = [];
            cv.subscribe((event) => actualEvents.push(event));

            // Add one item.
            o.update({ Type: CollectionChangeType.Add, NewItems: [1] });

            strict.deepEqual([...cv], [1]);
            strict.equal(actualEvents.length, 1);

            // Add two items.
            o.update({ Type: CollectionChangeType.Add, NewItems: [1, 1, 2] });

            strict.deepEqual([...cv], [1, 2]);

            strict.equal(actualEvents.length, 2);
            strict.equal(actualEvents[0].type, CollectionChangeType.Add);
            strict.deepEqual(actualEvents[0].items, [1]);
            strict.equal(actualEvents[1].type, CollectionChangeType.Add);

            // Should raise both as it could be an update.
            strict.deepEqual(actualEvents[1].items, [1, 2]);
        });

        it('when add items and key selector and filter duplicates are not added.', function () {
            // Arrange.
            let o = new ObservableArray<number>();
            let cv = new CollectionView(o, x => x);
            cv.filterBy({ predicate: () => true });

            let actualEvents: CollectionViewChangedData<number>[] = [];
            cv.subscribe((event) => actualEvents.push(event));

            // Add one item.
            o.update({ Type: CollectionChangeType.Add, NewItems: [1] });

            strict.deepEqual([...cv], [1]);
            strict.equal(actualEvents.length, 1);

            // Add two items.
            o.update({ Type: CollectionChangeType.Add, NewItems: [1, 1, 2] });

            strict.deepEqual([...cv], [1, 2]);

            strict.equal(actualEvents.length, 2);
            strict.equal(actualEvents[0].type, CollectionChangeType.Add);
            strict.deepEqual(actualEvents[0].items, [1]);
            strict.equal(actualEvents[1].type, CollectionChangeType.Add);

            // Should raise both as it could be an update.
            strict.deepEqual(actualEvents[1].items, [1, 2]);
        });

        it('when add and collectionView is sorted, reorder is raised.', function () {
            // Arrange.
            let o = new ObservableKeyArray<number, number>(x => x);
            let cv = new CollectionView(o);
            cv.sortBy({ ascendingComparator: (a, b) => a - b });

            let raisedEvents: CollectionViewChangeType[] = [];
            cv.subscribe((event) => raisedEvents.push(event.type));

            // Act.
            o.add(3, 1);

            // Assert.
            strict.deepEqual([...cv], [1, 3])
            strict.deepEqual(raisedEvents, [CollectionViewChangeType.Add, CollectionViewChangeType.Reorder]);
        });

        it('when remove item is removed.', function () {
            // Arrange.
            let o = new ObservableKeyArray<number, number>(x => x);
            let cv = new CollectionView(o);
            o.add(1);

            let callbackFiredCount = 0;
            cv.subscribe(() => callbackFiredCount++);

            // Act.
            o.remove(1);

            // Assert.
            strict.deepEqual([...cv], []);
            strict.equal(callbackFiredCount, 1);
        });

        it('when remove and collectionView is sorted reorder is not raised.', function () {
            // Arrange.
            let o = new ObservableKeyArray<number, number>(x => x);
            let cv = new CollectionView(o);
            o.add(1, 2, 3);

            cv.sortBy({ ascendingComparator: (a, b) => a - b });

            let raisedEvents: CollectionViewChangeType[] = [];
            cv.subscribe((event) => raisedEvents.push(event.type));

            // Act.
            o.remove(2);

            // Assert.
            strict.deepEqual([...cv], [1, 3])
            strict.deepEqual(raisedEvents, [CollectionViewChangeType.Remove]);
        });

        it('when remove items are removed.', function () {
            // Arrange.
            let o = new ObservableKeyArray<number, number>(x => x);
            let cv = new CollectionView(o);
            o.add(1, 2, 3);

            let callbackFiredCount = 0;
            cv.subscribe(() => callbackFiredCount++);

            // Act.
            o.remove(1, 3);

            // Assert.
            strict.deepEqual([...cv], [2]);
            strict.equal(callbackFiredCount, 1);
        });
    });

    describe('sorting', function () {
        it('when sort changes should reorder items.', function () {
            // Arrange.
            let o = new ObservableKeyArray<number, number>(x => x);
            let cv = new CollectionView(o);
            o.add(3, 2, 1);

            let callbackFiredCount = 0;
            cv.sortChanged.subscribe(event => callbackFiredCount++);

            // Act.
            cv.sortBy({ ascendingComparator: (a, b) => a - b });

            // Assert.
            strict.deepEqual([...cv], [1, 2, 3]);
            strict.equal(callbackFiredCount, 1);
        });

        it('added items should be sorted.', function () {
            // Arrange.
            let o = new ObservableKeyArray<number, number>(x => x);
            let cv = new CollectionView(o);
            cv.sortBy({ ascendingComparator: (a, b) => a - b });

            let raisedEvents: CollectionViewChangeType[] = [];
            cv.subscribe((event) => raisedEvents.push(event.type));

            // Act.
            o.add(3, 2, 1);

            // Assert.
            strict.deepEqual([...cv], [1, 2, 3]);
            strict.deepEqual(raisedEvents, [CollectionViewChangeType.Add, CollectionViewChangeType.Reorder]);
        });
    });

    describe('filtering', function () {
        it('when no filter all initial items in values', function () {
            // Arrange.
            let o = new ObservableKeyArray<number, number>(x => x);
            o.add(1, 2, 3);

            let cv = new CollectionView(o);

            // Assert.
            strict.deepEqual([...cv], [1, 2, 3]);
        });

        it('when no filter added items in values', function () {
            // Arrange.
            let o = new ObservableKeyArray<number, number>(x => x);
            let cv = new CollectionView(o);

            // Act.
            o.add(1, 2, 3);

            // Assert.
            strict.deepEqual([...cv], [1, 2, 3]);
        });

        it('when no filter removed items are removed from values', function () {
            // Arrange.
            let o = new ObservableKeyArray<number, number>(x => x);
            o.add(1, 2, 3);

            let cv = new CollectionView(o);

            // Act.
            o.remove(2);

            // Assert.
            strict.deepEqual([...cv], [1, 3]);
        });

        it('when add filter only allowed items in values', function () {
            // Arrange.
            let o = new ObservableKeyArray<number, number>(x => x);
            o.add(1, 2, 3);

            let cv = new CollectionView(o);
            let raisedEvents: CollectionViewChangedData<number>[] = [];
            cv.subscribe(event => raisedEvents.push(event));

            // Act.            
            cv.filterBy({ predicate: number => number !== 2 });

            // Assert.
            strict.deepEqual([...cv], [1, 3]);

            strict.equal(raisedEvents.length, 1);
            let event = raisedEvents[0];
            strict.equal(event.type, CollectionViewChangeType.Reset);
        });

        it('when filter only allowed added items in values', function () {
            // Arrange.
            let o = new ObservableKeyArray<number, number>(x => x);

            let cv = new CollectionView(o);
            cv.filterBy({ predicate: number => number !== 2 });
            let raisedEvents: CollectionViewChangedData<number>[] = [];
            cv.subscribe(event => raisedEvents.push(event));

            // Act.
            o.add(1, 2, 3);

            // Assert.
            strict.deepEqual([...cv], [1, 3]);

            strict.equal(raisedEvents.length, 1);
            let event = raisedEvents[0];
            strict.equal(event.type, CollectionViewChangeType.Add);
            strict.deepEqual(event.items, [1, 3]);
        });

        it('when filter and sorting adding items reorder raised. ', function () {
            // Arrange.
            let o = new ObservableKeyArray<number, number>(x => x);

            let cv = new CollectionView(o);
            cv.filterBy({ predicate: number => number !== 2 });
            cv.sortBy({ ascendingComparator: (a, b) => a - b });

            let raisedEvents: CollectionViewChangedData<number>[] = [];
            cv.subscribe(event => raisedEvents.push(event));

            // Act.
            o.add(1, 2, 3);

            // Assert.
            strict.deepEqual([...cv], [1, 3]);

            strict.equal(raisedEvents.length, 2);
            let event = raisedEvents[1];
            strict.equal(event.type, CollectionViewChangeType.Reorder);
        });

        it('when remove filter all items in values', function () {
            // Arrange.
            let o = new ObservableKeyArray<number, number>(x => x);

            let cv = new CollectionView(o);
            cv.filterBy({ predicate: number => number !== 2 });

            o.add(1, 2, 3);

            let raisedEvents: CollectionViewChangedData<number>[] = [];
            cv.subscribe(event => raisedEvents.push(event));

            // Act.
            cv.filterBy();

            // Assert.
            strict.deepEqual([...cv], [1, 2, 3]);

            strict.equal(raisedEvents.length, 1);
            let event = raisedEvents[0];
            strict.equal(event.type, CollectionViewChangeType.Reset);
        });

        it('when change filter only allowed items in values', function () {
            // Arrange.
            let o = new ObservableKeyArray<number, number>(x => x);
            let cv = new CollectionView(o);
            cv.filterBy({ predicate: number => number !== 2 });

            o.add(1, 2, 3);

            let raisedEvents: CollectionViewChangedData<number>[] = [];
            cv.subscribe(event => raisedEvents.push(event));

            // Act.
            cv.filterBy({ predicate: number => number !== 1 });

            // Assert.
            strict.deepEqual([...cv], [2, 3]);

            strict.equal(raisedEvents.length, 1);
            let event = raisedEvents[0];
            strict.equal(event.type, CollectionViewChangeType.Reset);
        });

        it('when filter remove items', function () {
            // Arrange.
            let o = new ObservableKeyArray<number, number>(x => x);
            o.add(1, 2, 3);

            let cv = new CollectionView(o);
            cv.filterBy({ predicate: number => number !== 2 });
            let raisedEvents: CollectionViewChangedData<number>[] = [];
            cv.subscribe(event => raisedEvents.push(event));

            // Act.
            o.remove(1);

            // Assert.                        
            strict.deepEqual([...cv], [3]);

            strict.equal(raisedEvents.length, 1);
            let event = raisedEvents[0];
            strict.equal(event.type, CollectionViewChangeType.Remove);
            strict.deepEqual(event.items, [1]);
        });

        it('when filter remove filtered items', function () {
            // Arrange.
            let o = new ObservableKeyArray<number, number>(x => x);
            o.add(1, 2, 3);

            let cv = new CollectionView(o);
            cv.filterBy({ predicate: number => number !== 2 });
            let raisedEvents: CollectionViewChangedData<number>[] = [];
            cv.subscribe(event => raisedEvents.push(event));

            // Act.
            o.remove(2);

            // Assert.                        
            strict.deepEqual([...cv], [1, 3]);

            strict.equal(raisedEvents.length, 0);
        });

        it('when filter reset items', function () {
            // Arrange.
            let o = new ObservableKeyArray<number, number>(x => x);
            o.add(1, 2, 3);

            let cv = new CollectionView(o);
            cv.filterBy({ predicate: number => number !== 2 && number !== 5 });
            let raisedEvents: CollectionViewChangedData<number>[] = [];
            cv.subscribe(event => raisedEvents.push(event));

            // Act.
            o.reset(4, 5, 6);

            // Assert.                        
            strict.deepEqual([...cv], [4, 6]);

            strict.equal(raisedEvents.length, 1);
            let event = raisedEvents[0];
            strict.equal(event.type, CollectionViewChangeType.Reset);
        });

        it('when filter clear items', function () {
            // Arrange.
            let o = new ObservableKeyArray<number, number>(x => x);
            o.add(1, 2, 3);

            let cv = new CollectionView(o);
            cv.filterBy({ predicate: number => number !== 2 });
            let raisedEvents: CollectionViewChangedData<number>[] = [];
            cv.subscribe(event => raisedEvents.push(event));

            // Act.
            o.reset();

            // Assert.            
            strict.deepEqual([...cv], []);

            strict.equal(raisedEvents.length, 1);
            let event = raisedEvents[0];
            strict.equal(event.type, CollectionViewChangeType.Reset);
        });
    });
});
