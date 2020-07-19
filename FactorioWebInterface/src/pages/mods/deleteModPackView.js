import { VirtualComponent } from "../../components/virtualComponent";
import { Modal } from "../../components/modal";
import { FlexPanel } from "../../components/flexPanel";
import { Button } from "../../components/button";
import { Label } from "../../components/label";
export class DeleteModPackView extends VirtualComponent {
    constructor(deleteModPackViewModel) {
        super();
        let title = document.createElement('h4');
        title.textContent = 'Confirm Delete Mod Pack';
        let mainPanel = new FlexPanel(FlexPanel.classes.vertical);
        let label = new Label();
        label.textContent = `Delete Mod Pack ${deleteModPackViewModel.name}?`;
        label.style.fontWeight = 'bold';
        label.style.marginBottom = '1em';
        let buttonsPanel = new FlexPanel(FlexPanel.classes.horizontal, FlexPanel.classes.childSpacing, FlexPanel.classes.spacingNone);
        let createButton = new Button('Delete', Button.classes.danger).setCommand(deleteModPackViewModel.deleteCommand);
        let cancelButton = new Button('Cancel', Button.classes.primary).setCommand(deleteModPackViewModel.cancelCommand);
        buttonsPanel.append(createButton, cancelButton);
        mainPanel.append(label, buttonsPanel);
        let modal = new Modal(mainPanel)
            .setHeader(title);
        modal.style.minWidth = '600px';
        this._root = modal;
    }
}
//# sourceMappingURL=deleteModPackView.js.map