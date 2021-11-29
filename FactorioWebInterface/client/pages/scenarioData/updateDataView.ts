﻿import { VirtualForm } from "../../components/virtualForm";
import { UpdateDataViewModel } from "./updateDataViewModel";
import { TextField } from "../../components/textField";
import { TextareaField } from "../../components/textAreaField";
import { VirtualComponent } from "../../components/virtualComponent";
import { Collapse } from "../../components/collapse";
import { ToggleButton } from "../../components/toggleButton";
import { Button } from "../../components/button";
import { Field } from "../../components/field";

export class UpdateDataView extends VirtualComponent {
    constructor(updateDataViewModel?: UpdateDataViewModel) {
        super();

        let updateButton = new Button('Update', Button.classes.link, 'field-body')
            .setCommand(updateDataViewModel.updateCommand);
        updateButton.style.width = 'min-content';

        let form = new VirtualForm(updateDataViewModel, [
            new TextField('DataSet', 'Data Set:').setTooltip('The Data Set to update, add or remove entries from.'),
            new TextField('Key', 'Key:').setTooltip('The key for the entry.'),
            new TextareaField('Value', 'Value:').setTooltip('The value for the entry, leave blank to remove the entry.'),
            new Field(updateButton)
        ]);
        form.isHorizontal = true;
        form.hideErrors = true;
        let formStyle = form.root.style;
        formStyle.padding = '0 2rem 0.25rem 2rem';
        formStyle.margin = '0';

        let header = document.createElement('div');

        let thumbtack = document.createElement('i');
        thumbtack.classList.add('fas', 'fa-thumbtack');
        let toggleButton = new ToggleButton(thumbtack);
        toggleButton.setTooltip('Pin the form to keep it in view.');
        toggleButton.style.marginRight = '0.5em';

        header.append(toggleButton, 'Update Data');

        let collapse = new Collapse(header, form.root);
        collapse.classList.add('section');
        toggleButton.onToggle(state => {
            if (state) {
                collapse.style.top = '3.5rem';
                collapse.style.position = 'sticky';
                collapse.style.zIndex = '20';
            } else {
                collapse.style.top = '';
                collapse.style.position = '';
            }
        });
        collapse.open = true;

        this._root = collapse;
    }
}
