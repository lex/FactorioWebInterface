import "../components/component.less";
import { ViewModel } from "./test/vm";
import { TextField } from "../components/textField";
import { StackPanel } from "../components/stackPanel";
import { VirtualForm } from "../components/virtualForm";
import { NumberField } from "../components/numberField";
import { TextareaField } from "../components/textareaField";
import { CheckboxField } from "../components/checkboxField";
import { MainView } from "../pages/scenarioData/mainView";
import { Collapse } from "../components/collapse";
import { TabSet } from "../components/tabSet";
import { Tab } from "../components/tab";
import { TabHeaders } from "../components/tabHeaders";
import { Table } from "../components/table";
import { ObservableKeyArray } from "../utils/observableCollection";
import { FILE } from "dns";
import { CollectionChangedData, CollectionChangeType } from "./utils";
import { CollectionView } from "../utils/collectionView";
import { Box } from "../utils/box";

let vm = new ViewModel();

let props = ['name', 'age', 'prop1', 'prop2', 'prop2Enabled', 'message'];

for (let p of props) {
    vm.propertyChanged(p, (event => console.log(`${p}: ${event}`)));
    vm.errors.errorChanged(p, event => {
        if (!event.valid) {
            console.log(`Error - ${p}: ${event.error}`);
        }
    });
}

vm.age = 20;
vm.name = 'bob';

vm.age = 1;

let app = document.getElementById('app');

let messageTextArea = new TextareaField('message', 'Message:');
messageTextArea.input.style.height = '10em';

let prop2Field = new TextField('prop2', 'Prop2:');

let form = new VirtualForm(vm, [
    new TextField('name', 'Name:'),
    new NumberField('age', 'Age:'),
    new TextField('prop1', 'Prop1:'),
    prop2Field,
    new CheckboxField('prop2Enabled', 'Prop2Enabled'),
    messageTextArea
]);
form.root.classList.add('border');

prop2Field.enabled = vm.prop2Enabled;
vm.propertyChanged('prop2Enabled', event => {
    prop2Field.enabled = event;
})

let scenarioDataPage = new MainView();

let collaspe = new Collapse('header', scenarioDataPage.root);
//app.appendChild(collaspe);

//app.appendChild(scenarioDataPage.root);
//app.appendChild(form.root);

let tabSet = new TabSet([
    new Tab('header1').setContent('one'),
    new Tab('header2').setContent('two'),
    new Tab('header3').setContent('three'),
    new Tab('header4').setContent('four'),
    new Tab('header5').setContent('five'),
]);
tabSet.classList.add('border');
//app.appendChild(tabSet);

let left = new StackPanel();
left.style.justifySelf = 'flex-start';
left.appendChild(new Tab('left1').setContent('left one'));
left.appendChild(new Tab('left2').setContent('left two'));

let middle = document.createElement('div');
middle.style.flexBasis = '50%';

let right = new StackPanel();
right.style.justifySelf = 'flex-end';
right.appendChild(new Tab('right1').setContentFunc(() => 'right one'));
right.appendChild(new Tab('right2').setContentFunc(() => 'right two'));

let tabSet2 = new TabSet(new TabHeaders([left, middle, right]));
//app.appendChild(tabSet2);

interface File {
    name: string;
    selected: boolean;
    size: number;
    date: Date;
}

let source = new ObservableKeyArray<string, File>(file => file.name);

let fragment = document.createDocumentFragment();
let selectedHeader = document.createElement('input');
selectedHeader.type = 'checkbox';
selectedHeader.addEventListener('input', () => {
    for (let file of source.values()) {
        file.selected = selectedHeader.checked;
    }

    source.refresh();
});
selectedHeader.addEventListener('click', (event) => {
    event.cancelBubble = true;
});
fragment.appendChild(selectedHeader);
fragment.append(' Select');

let selectedCellBuilder = (selected: boolean, box: Box<File>) => {
    let file = box.value;
    let check = document.createElement('input');
    check.type = 'checkbox';
    check.checked = selected;
    check.addEventListener('input', () => {
        file.selected = check.checked;
        source.add(file);
    });

    return check;
};

let collectionView = new CollectionView(source);
//collectionView.sortBy({
//    ascending: true,
//    property: 'selected'
//});
collectionView.filterBy(file => file.selected);

for (let i = 0; i < 100; i++) {
    let file: File = { name: 'name' + i, selected: i % 2 === 0, size: 10 * i, date: new Date(2020, 0, i) };
    source.add(file);
}

let button = document.createElement('button');
button.innerText = 'compound sort';
button.onclick = (() => {
    collectionView.sortBy([
        {
            property: 'selected',
            ascending: false
        },
        {
            property: 'name',
            ascending: true
        }
    ]);
});
app.appendChild(button);

let textField = document.createElement('input');
textField.oninput = (() => {
    console.log(textField.value);
    collectionView.filterBy(file => {
        let text = textField.value.toLowerCase();
        return (file.date + '').toLowerCase().includes(text) ||
            (file.name + '').toLowerCase().includes(text) ||
            (file.size + '').toLowerCase().includes(text);
    });
});
app.appendChild(textField);

let table = new Table(collectionView, [
    { property: 'selected', header: () => fragment, cell: selectedCellBuilder },
    { property: 'name', header: () => 'Name' },
    { property: 'size', header: () => 'Size' },
    { property: 'date', header: () => 'Date', sortingDisabled: false },
]);

let rankings = new ObservableKeyArray<string, object>(obj => obj['key']);
for (let i = 0; i < 3500; i++) {
    rankings.add({ key: 'abcdefgh' + i, value: i });
}

let rankingsTable = new Table(rankings, [
    { property: 'key' },
    { property: 'value' }
], (item) => console.log(item));

app.appendChild(table);
