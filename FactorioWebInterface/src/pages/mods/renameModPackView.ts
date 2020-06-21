import { VirtualComponent } from "../../components/virtualComponent";
import { Modal } from "../../components/modal";
import { StackPanel } from "../../components/stackPanel";
import { VirtualForm } from "../../components/virtualForm";
import { TextField } from "../../components/textField";
import { Button } from "../../components/button";
import { Field } from "../../components/field";
import { RenameModPackViewModel } from "./renameModPackViewModel";

export class RenameModPackView extends VirtualComponent {
    constructor(renameModPackViewModel: RenameModPackViewModel) {
        super();

        let title = document.createElement('h4');
        title.textContent = 'Rename Mod Pack';

        let buttonsPanel = new StackPanel(StackPanel.direction.row);
        buttonsPanel.classList.add('no-spacing');
        let createButton = new Button('Rename', Button.classes.success).setCommand(renameModPackViewModel.renameCommand);
        let cancelButton = new Button('Cancel', Button.classes.primary).setCommand(renameModPackViewModel.cancelCommand);
        buttonsPanel.append(createButton, cancelButton);

        let form = new VirtualForm(renameModPackViewModel, [
            new TextField('name', 'Name'),
            new Field(buttonsPanel)
        ]);
        form.isHorizontal = true;

        let modal = new Modal(form.root)
            .setHeader(title);
        modal.style.minWidth = '480px';

        this._root = modal;
    }
}