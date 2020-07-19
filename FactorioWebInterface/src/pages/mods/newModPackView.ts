import { VirtualComponent } from "../../components/virtualComponent";
import { NewModPackViewModel } from "./newModPackViewModel";
import { Modal } from "../../components/modal";
import { FlexPanel } from "../../components/flexPanel";
import { VirtualForm } from "../../components/virtualForm";
import { TextField } from "../../components/textField";
import { Button } from "../../components/button";
import { Field } from "../../components/field";

export class NewModPackView extends VirtualComponent {
    constructor(newModPackViewModel: NewModPackViewModel) {
        super();

        let title = document.createElement('h4');
        title.textContent = 'New Mod Pack';

        let buttonsPanel = new FlexPanel(FlexPanel.classes.horizontal, FlexPanel.classes.childSpacing, FlexPanel.classes.spacingNone);
        let createButton = new Button('Create', Button.classes.success).setCommand(newModPackViewModel.createCommand);
        let cancelButton = new Button('Cancel', Button.classes.primary).setCommand(newModPackViewModel.cancelCommand);
        buttonsPanel.append(createButton, cancelButton);

        let form = new VirtualForm(newModPackViewModel, [
            new TextField('name', 'Name'),
            new Field(buttonsPanel)
        ]);
        form.isHorizontal = true;

        let modal = new Modal(form.root)
            .setHeader(title);
        modal.style.minWidth = '600px';

        this._root = modal;
    }
}