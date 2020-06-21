import { VirtualComponent } from "../../components/virtualComponent";
import { Modal } from "../../components/modal";
import { StackPanel } from "../../components/stackPanel";
import { Button } from "../../components/button";
import { Label } from "../../components/label";
export class DeleteModPackView extends VirtualComponent {
    constructor(deleteModPackViewModel) {
        super();
        let title = document.createElement('h4');
        title.textContent = 'Confirm Delete Mod Pack';
        let mainPanel = new StackPanel(StackPanel.direction.column);
        let label = new Label();
        label.textContent = `Delete Mod Pack ${deleteModPackViewModel.name}?`;
        label.style.fontWeight = 'bold';
        label.style.marginBottom = '1em';
        let buttonsPanel = new StackPanel(StackPanel.direction.row);
        buttonsPanel.classList.add('no-spacing');
        let createButton = new Button('Delete', Button.classes.danger).setCommand(deleteModPackViewModel.deleteCommand);
        let cancelButton = new Button('Cancel', Button.classes.primary).setCommand(deleteModPackViewModel.cancelCommand);
        buttonsPanel.append(createButton, cancelButton);
        mainPanel.append(label, buttonsPanel);
        let modal = new Modal(mainPanel)
            .setHeader(title);
        modal.style.minWidth = '480px';
        this._root = modal;
    }
}
//# sourceMappingURL=deleteModPackView.js.map