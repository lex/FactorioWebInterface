import "./consoleMessageView.ts.less";
import { VirtualComponent } from "../../components/virtualComponent";
import { MessageType } from "./serversTypes";
import { CollectionChangeType } from "../../ts/utils";
export class ConsoleMessageView extends VirtualComponent {
    constructor(messagesSource) {
        super();
        let messageList = document.createElement('div');
        messageList.classList.add('console-message-list');
        this._root = messageList;
        messagesSource.subscribe(event => {
            var _a, _b;
            switch (event.Type) {
                case CollectionChangeType.Add:
                    this.add(event.NewItems.values());
                    break;
                case CollectionChangeType.Remove:
                    this.remove(event.OldItems);
                    break;
                case CollectionChangeType.AddAndRemove:
                    this.remove(event.OldItems);
                    this.add(event.NewItems.values());
                    break;
                case CollectionChangeType.Reset:
                    messageList.innerHTML = '';
                    this.add((_b = (_a = event.NewItems) === null || _a === void 0 ? void 0 : _a.values()) !== null && _b !== void 0 ? _b : messagesSource.values());
                    break;
            }
        });
    }
    remove(items) {
        // this assumes the first item is always removed.
        for (let item of items) {
            let child = this._root.firstChild;
            child === null || child === void 0 ? void 0 : child.remove();
        }
    }
    add(items) {
        for (let item of items) {
            this.writeMessage(item);
        }
    }
    writeMessage(message) {
        let messageList = this._root;
        let div = document.createElement('div');
        switch (message.MessageType) {
            case MessageType.Output:
                div.innerText = message.Message;
                //div.classList.add(ConsoleMessageView.classes.output);
                break;
            case MessageType.Wrapper:
                div.innerText = `[Wrapper] ${message.Message}`;
                //div.classList.add(ConsoleMessageView.classes.wrapper);
                break;
            case MessageType.Control:
                div.innerText = `[Control] ${message.Message}`;
                div.classList.add(ConsoleMessageView.classes.control);
                break;
            case MessageType.Discord:
                div.innerText = message.Message;
                //div.classList.add(ConsoleMessageView.classes.discord);
                break;
            case MessageType.Status:
                div.innerText = message.Message;
                div.classList.add(ConsoleMessageView.classes.status);
                break;
            case MessageType.Error:
                div.innerText = `[Error] ${message.Message}`;
                div.classList.add(ConsoleMessageView.classes.error);
                break;
            default:
                return;
        }
        let left = window.scrollX;
        let top = window.scrollY;
        if (messageList.scrollTop + messageList.clientHeight >= messageList.scrollHeight) {
            messageList.appendChild(div);
            messageList.scrollTop = messageList.scrollHeight;
        }
        else {
            messageList.appendChild(div);
        }
        window.scrollTo(left, top);
    }
}
ConsoleMessageView.classes = {
    output: 'console-message-output',
    wrapper: 'console-message-wrapper',
    control: 'console-message-control',
    discord: 'console-message-discord',
    status: 'console-message-status',
    error: 'console-message-error',
};
//# sourceMappingURL=consoleMessageView.js.map