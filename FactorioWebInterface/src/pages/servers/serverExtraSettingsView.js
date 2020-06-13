import { VirtualComponent } from "../../components/virtualComponent";
import { Collapse } from "../../components/collapse";
import { VirtualForm } from "../../components/virtualForm";
import { CheckboxField } from "../../components/checkboxField";
import { Field } from "../../components/field";
import { StackPanel } from "../../components/stackPanel";
import { Button } from "../../components/button";
import { TextInput } from "../../components/textInput";
export class ServerExtraSettingsView extends VirtualComponent {
    constructor(serverExtraSettingsViewModel) {
        super();
        this._serverExtraSettingsViewModel = serverExtraSettingsViewModel;
        let form = new VirtualForm(serverExtraSettingsViewModel, [
            new CheckboxField('SyncBans', 'Sync bans - Synchronize bans to and from this server and with the ban database'),
            new CheckboxField('BuildBansFromDatabaseOnStart', 'Sync banlist - Overwrite server-banlist.json from ban database when server starts'),
            new CheckboxField('SetDiscordChannelName', 'Sync Discord channel name - Update linked channel with server name and version when server starts/stops'),
            new CheckboxField('GameChatToDiscord', 'Player chat to Discord - Send player chat to the linked Discord channel'),
            new CheckboxField('GameShoutToDiscord', 'Player shout to Discrod - Send player shout to the linked Discord channel'),
            new CheckboxField('DiscordToGameChat', 'Discord to game - Send linked Discord channel messages to game chat'),
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
        let header = new StackPanel(StackPanel.direction.row);
        header.classList.add('spacing-none');
        header.style.flexGrow = '1';
        header.append('Server Settings', this._unsavedWarning);
        this._collapse = new Collapse(header, form.root);
        this._collapse.open = true;
        this._collapse.classList.add('is-4', 'border', 'header', 'wide');
        this._collapse.style.marginTop = '1rem';
        serverExtraSettingsViewModel.bind('saved', event => this.setCollapseUnSavedWarning(event));
        this._root = this._collapse;
    }
    builldFormButtons() {
        let panel = new StackPanel(StackPanel.direction.row);
        let saveButton = new Button('Save Changes', Button.classes.success)
            .setCommand(this._serverExtraSettingsViewModel.saveCommand);
        let undoButton = new Button('Undo Changes', Button.classes.danger)
            .setCommand(this._serverExtraSettingsViewModel.undoCommand);
        let copyButton = new Button('Copy Settings', Button.classes.link)
            .setCommand(this._serverExtraSettingsViewModel.copyCommand);
        let pasteSettings = new TextInput();
        this._serverExtraSettingsViewModel.bind('pasteText', event => pasteSettings.placeholder = event);
        pasteSettings.onpaste = (ev) => {
            event.preventDefault();
            let text = ev.clipboardData.getData('text/plain');
            this._serverExtraSettingsViewModel.pasteSettings(text);
        };
        pasteSettings.onmousedown = () => {
            pasteSettings.value = '';
            this._serverExtraSettingsViewModel.pasteSettingsClicked();
        };
        pasteSettings.oninput = () => pasteSettings.value = '';
        pasteSettings.style.flexBasis = '10em';
        pasteSettings.style.flexGrow = '0';
        panel.append(saveButton, undoButton, copyButton, pasteSettings);
        return panel;
    }
    setCollapseUnSavedWarning(saved) {
        if (saved) {
            this._collapse.style.borderColor = '';
            this._unsavedWarning.style.display = 'none';
        }
        else {
            this._collapse.style.borderColor = '#ff3860';
            this._unsavedWarning.style.display = 'block';
        }
    }
}
//# sourceMappingURL=serverExtraSettingsView.js.map