import { VirtualComponent } from "../../components/virtualComponent";
import { Modal } from "../../components/modal";
import { FlexPanel } from "../../components/flexPanel";
import { VirtualForm } from "../../components/virtualForm";
import { TextField } from "../../components/textField";
import { Button } from "../../components/button";
import { Field } from "../../components/field";
import { Label } from "../../components/label";
export class RenameModPackView extends VirtualComponent {
    constructor(renameModPackViewModel) {
        super();
        let title = document.createElement('h4');
        title.textContent = 'Rename Mod Pack';
        let label = new Label();
        label.innerText = `Old Name: ${renameModPackViewModel.name}`;
        label.style.fontWeight = 'bold';
        let buttonsPanel = new FlexPanel(FlexPanel.classes.horizontal, FlexPanel.classes.childSpacing, FlexPanel.classes.spacingNone);
        let createButton = new Button('Rename', Button.classes.success).setCommand(renameModPackViewModel.renameCommand);
        let cancelButton = new Button('Cancel', Button.classes.primary).setCommand(renameModPackViewModel.cancelCommand);
        buttonsPanel.append(createButton, cancelButton);
        let form = new VirtualForm(renameModPackViewModel, [
            new Field(label),
            new TextField('name', 'New Name'),
            new Field(buttonsPanel)
        ]);
        form.isHorizontal = true;
        let modal = new Modal(form.root)
            .setHeader(title);
        modal.style.minWidth = '600px';
        this._root = modal;
    }
}
//# sourceMappingURL=renameModPackView.js.map