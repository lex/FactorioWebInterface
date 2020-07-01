import { VirtualComponent } from "../../components/virtualComponent";
import { ServerSettingsViewModel } from "./serverSettingsViewModel";
import { Collapse } from "../../components/collapse";
import { VirtualForm } from "../../components/virtualForm";
import { TextField } from "../../components/textField";
import { TextareaField } from "../../components/textareaField";
import { NumberField } from "../../components/numberField";
import { CheckboxField } from "../../components/checkboxField";
import { Field } from "../../components/field";
import { FlexPanel } from "../../components/flexPanel";
import { Button } from "../../components/button";
import { TextInput } from "../../components/textInput";

export class ServerSettingsView extends VirtualComponent {
    private _serverSettingsViewModel: ServerSettingsViewModel
    private _unsavedWarning: HTMLElement;
    private _collapse: Collapse;

    constructor(serverSettingsViewModel: ServerSettingsViewModel) {
        super();

        this._serverSettingsViewModel = serverSettingsViewModel;

        let adminsField = new TextareaField('Admins', 'Admins (if not default)');
        serverSettingsViewModel.bind('adminsEditEnabled', event => adminsField.enabled = event);

        let form = new VirtualForm(serverSettingsViewModel, [
            new TextField('Name'),
            new TextareaField('Description'),
            new TextareaField('Tags'),
            new NumberField('MaxPlayers', 'Max Players (0 for unlimited)'),
            new TextField('GamePassword', 'Game password (blank for no password)'),
            new NumberField('MaxUploadSlots', 'Max Upload Slots (0 for unlimited)'),
            new CheckboxField('AutoPause', 'Auto pause when no players online'),
            new CheckboxField('UseDefaultAdmins', 'Use Default Admins'),
            adminsField,
            new NumberField('AutosaveInterval', 'Autosave Interval (in minutes, min value 1)'),
            new NumberField('AutosaveSlots', 'Autosave Slots (0 to turn off auto saves)'),
            new CheckboxField('NonBlockingSaving', 'Non Blocking Saving'),
            new CheckboxField('PublicVisible', 'Public Visible'),
            new Field(this.builldFormButtons()),
        ]);

        this._unsavedWarning = document.createElement('div');
        this._unsavedWarning.style.fontSize = '1rem';
        this._unsavedWarning.style.color = '#ff3860';
        this._unsavedWarning.style.marginLeft = 'auto';
        this._unsavedWarning.style.alignSelf = 'center';
        let icon = document.createElement('i');
        icon.classList.add('fas', 'fa-exclamation-triangle');
        icon.style.marginRight = '0.35em';
        this._unsavedWarning.append(icon, 'There are unsaved changes.');

        let header = new FlexPanel(FlexPanel.direction.row);
        header.classList.add('spacing-none');
        header.style.flexGrow = '1';
        header.append('Server Settings', this._unsavedWarning);

        this._collapse = new Collapse(header, form.root);
        this._collapse.open = true;
        this._collapse.classList.add('is-4', 'border', 'header', 'wide');
        this._collapse.style.marginTop = '1rem';
        serverSettingsViewModel.bind('saved', event => this.setCollapseUnSavedWarning(event));

        this._root = this._collapse;
    }

    private builldFormButtons(): Node {
        let panel = new FlexPanel(FlexPanel.direction.row);

        let saveButton = new Button('Save Changes', Button.classes.success)
            .setCommand(this._serverSettingsViewModel.saveCommand);
        let undoButton = new Button('Undo Changes', Button.classes.danger)
            .setCommand(this._serverSettingsViewModel.undoCommand);
        let copyButton = new Button('Copy Settings', Button.classes.link)
            .setCommand(this._serverSettingsViewModel.copyCommand);

        let pasteSettings = new TextInput();
        this._serverSettingsViewModel.bind('pasteText', event => pasteSettings.placeholder = event);
        pasteSettings.onpaste = (ev: ClipboardEvent) => {
            event.preventDefault();

            let text = ev.clipboardData.getData('text/plain');
            this._serverSettingsViewModel.pasteSettings(text);
        }
        pasteSettings.onmousedown = () => {
            pasteSettings.value = '';
            this._serverSettingsViewModel.pasteSettingsClicked();
        }
        pasteSettings.oninput = () => pasteSettings.value = '';
        pasteSettings.style.flexBasis = '10em';
        pasteSettings.style.flexGrow = '0';

        panel.append(saveButton, undoButton, copyButton, pasteSettings);

        return panel;
    }

    private setCollapseUnSavedWarning(saved: boolean) {
        if (saved) {
            this._collapse.style.borderColor = '';
            this._unsavedWarning.style.display = 'none';
        } else {
            this._collapse.style.borderColor = '#ff3860';
            this._unsavedWarning.style.display = 'block';
        }
    }
}