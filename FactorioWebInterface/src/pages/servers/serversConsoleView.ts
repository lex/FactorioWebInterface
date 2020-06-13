import { VirtualComponent } from "../../components/virtualComponent";
import { Collapse } from "../../components/collapse";
import { Select } from "../../components/select";
import { ServersConsoleViewModel } from "./serversConsoleViewModel";
import { StackPanel } from "../../components/stackPanel";
import { Button, iconButton } from "../../components/button";
import { Icon } from "../../components/icon";
import { ConsoleMessageView } from "./consoleMessageView";
import { TextInput } from "../../components/textInput";
import { EventListener } from "../../utils/eventListener";
import { VirtualForm } from "../../components/virtualForm";
import { TextField } from "../../components/textField";

export class ServersConsoleView extends VirtualComponent {
    constructor(serversConsoleViewModel: ServersConsoleViewModel) {
        super();

        let headerPanel = new StackPanel(StackPanel.direction.row);
        headerPanel.classList.add('no-spacing');
        headerPanel.style.alignItems = 'center';

        let serverIdSelect = new Select(serversConsoleViewModel.serverIds);
        serverIdSelect.style.fontSize = '1rem';
        serverIdSelect.style.fontWeight = 'normal';
        serverIdSelect.style.margin = '-0.3em 0em -0.3em 1em';
        serverIdSelect.onclick = event => event.stopPropagation();

        let statusLabel = document.createElement('label');
        statusLabel.textContent = 'Status:';
        statusLabel.style.fontSize = '1rem';
        statusLabel.style.fontWeight = 'bold';
        statusLabel.style.marginLeft = '1em';

        let statusText = document.createElement('label');        
        serversConsoleViewModel.status.bind(event => statusText.textContent = event);
        statusText.style.fontSize = '1rem';
        statusText.style.fontWeight = 'bold';
        statusText.style.marginLeft = '0.35em';

        let versionLabel = document.createElement('label');
        versionLabel.textContent = 'Version:';
        versionLabel.style.fontSize = '1rem';
        versionLabel.style.fontWeight = 'bold';
        versionLabel.style.marginLeft = '1em';

        let versionText = document.createElement('label');        
        serversConsoleViewModel.version.bind(event => versionText.textContent = event);
        versionText.style.fontSize = '1rem';
        versionText.style.fontWeight = 'bold';
        versionText.style.marginLeft = '0.35em';

        headerPanel.append('Console', serverIdSelect, statusLabel, statusText, versionLabel, versionText);;

        let mainPanel = new StackPanel(StackPanel.direction.column);

        let topPanel = new StackPanel(StackPanel.direction.row);

        let resumeButton = iconButton(Icon.classes.play, 'Resume', Button.classes.success)
            .setCommand(serversConsoleViewModel.resumeCommand);
        let loadButton = iconButton(Icon.classes.play, 'Load', Button.classes.success)
            .setCommand(serversConsoleViewModel.loadCommand);
        let startScenarioButton = iconButton(Icon.classes.play, 'Start Scenario', Button.classes.success)
            .setCommand(serversConsoleViewModel.startScenarioCommand);
        let saveButton = iconButton(Icon.classes.save, 'Save', Button.classes.success)
            .setCommand(serversConsoleViewModel.saveCommand);
        let manageVersionButton = iconButton(Icon.classes.download, 'Manage Version', Button.classes.link)
            .setCommand(serversConsoleViewModel.manageVersionCommand);
        let stopButton = iconButton(Icon.classes.stop, 'Stop', Button.classes.danger)
            .setCommand(serversConsoleViewModel.stopCommand);
        let forceStopButton = iconButton(Icon.classes.bomb, 'Force Stop', Button.classes.danger)
            .setCommand(serversConsoleViewModel.forceStopCommand);

        topPanel.append(resumeButton, loadButton, saveButton, startScenarioButton, manageVersionButton, stopButton, forceStopButton);

        let messageView = new ConsoleMessageView(serversConsoleViewModel.messages);

        let bottomPanel = new StackPanel(StackPanel.direction.row);

        let sendInput = new TextInput();
        sendInput.placeholder = 'Message or Command';
        sendInput.onKeyUp(event => serversConsoleViewModel.sendInputKey(event.keyCode));
        sendInput.bind(serversConsoleViewModel, 'sendText');

        let sendButton = new Button('Send')
            .setCommand(serversConsoleViewModel.sendCommand);

        bottomPanel.append(sendInput, sendButton);

        mainPanel.append(topPanel, messageView.root, bottomPanel);

        let collapse = new Collapse(headerPanel, mainPanel);
        collapse.open = true;
        collapse.classList.add('is-4', 'border', 'header');
        collapse.style.marginTop = '1rem';

        this._root = collapse;
    }
}