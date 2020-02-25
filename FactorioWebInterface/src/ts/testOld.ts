import { ObservableObject } from "./utilsOld/observableObject";
import { Form } from "./componentsOld/form";
import { Validator, ValidationRule, ValidationResult } from "./utilsOld/validator";
import { StackPanel } from "./componentsOld/stackPanel";
import { Button } from "./componentsOld/button";
import { Collapse } from "./componentsOld/collapse";
import { ViewModel } from "./testOld/vm";
import { App } from "./componentsOld/app";
import { CheckboxField } from "./componentsOld/checkboxField";
import { TextField } from "./componentsOld/textField";
import { NumberField } from "./componentsOld/numberField";
import { ComponentBase } from "./componentsOld/componentBase";
import { Classes } from "./componentsOld/classes";
import { TabSet } from "./componentsOld/tabSet";
import { Tab } from "./componentsOld/tab";
import { Lazy } from "./componentsOld/lazy";
import { TextBlock } from "./componentsOld/textBlock";
import { If } from "./componentsOld/if";

let formTest = () => {
    let vm = new ViewModel();

    let prop2Field = new TextField('prop2', 'Prop two');
    prop2Field.enabled = vm.prop2Enabled;

    let form = new Form(vm, [
        new TextField('name', 'Name'),
        new NumberField('age', 'Age'),
        new TextField('prop1', 'Prop one'),
        prop2Field,
        new CheckboxField('prop2Enabled', 'Prop two enabled')
    ]);

    vm.propertyChanged((s, e) => {
        if (e === 'prop2Enabled' || e === '') {
            prop2Field.enabled = s.prop2Enabled;
        }
    });

    vm.name = 'bob';
    vm.age = 20;

    return form;
}

let collapseTest = () => {
    let leftStackPanel = new StackPanel({
        direction: StackPanel.direction.column,
        children: [
            new Button('left one'),
            new Button('left two')
        ]
    });

    let rightStackPanel = new StackPanel({
        direction: StackPanel.direction.column,
        children: [
            new Button('right one'),
            new Button('right two')
        ],
        classes: [Classes.ignoreDefaultSpacing]
    });

    let mainStackPanel = new StackPanel({
        direction: StackPanel.direction.row,
        children: [
            leftStackPanel,
            rightStackPanel
        ]
    });

    return new Collapse(mainStackPanel);
}

let ifTest = () => {
    let panel = new StackPanel({ direction: StackPanel.direction.column });
    for (let i = 0; i < 10; i++) {
        let button = new Button('click me' + i);
        let hider = new If(new TextBlock('Some Text' + i));
        panel.addChild(button);
        panel.addChild(hider);
        button.onClick(() => hider.enabled = !hider.enabled);
    }
    return panel;
}

let ifTest2 = () => {
    let panel = new StackPanel({ direction: StackPanel.direction.column });
    let hider: ComponentBase = new TextBlock('All on');
    for (let i = 0; i < 3; i++) {
        let button = new Button('on');
        hider = new If(hider);
        panel.addChild(button);

        let h = hider as If;
        button.onClick(() => {
            h.enabled = !h.enabled;
            button.content = h.enabled ? 'on' : 'off';
        });
    }

    panel.addChild(hider);
    return panel;
}

let tabSet = new TabSet([
    new Tab('one', new Lazy(() => new Button('button 1'))),
    new Tab('form test', new Lazy(formTest)),
    new Tab('collapse test', new Lazy(collapseTest)),
    new Tab('if test', new Lazy(ifTest)),
    new Tab('if test 2', new Lazy(ifTest2))
])

let app = new App();
app.content = tabSet;

