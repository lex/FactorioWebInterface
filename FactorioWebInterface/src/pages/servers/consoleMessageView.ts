import "./consoleMessageView.ts.less";
import { VirtualComponent } from "../../components/virtualComponent";
import { MessageData, MessageType } from "./serversTypes";
import { CollectionChangeType } from "../../ts/utils";
import { ObservableCollection } from "../../utils/collections/module";

export class ConsoleMessageView extends VirtualComponent {
    static readonly classes = {
        output: 'console-message-output',
        wrapper: 'console-message-wrapper',
        control: 'console-message-control',
        discord: 'console-message-discord',
        status: 'console-message-status',
        error: 'console-message-error',
    }

    constructor(messagesSource: ObservableCollection<MessageData>) {
        super();

        let messageList = document.createElement('div');
        messageList.classList.add('console-message-list')
        this._root = messageList;

        messagesSource.subscribe(event => {
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
                    this.add(event.NewItems?.values() ?? messagesSource.values());
                    break;
            }
        });
    }

    private remove(items: MessageData[]) {
        // this assumes the first item is always removed.
        for (let item of items) {
            let child = this._root.firstChild;
            child?.remove();
        }
    }

    private add(items: IterableIterator<MessageData>) {
        for (let item of items) {
            this.writeMessage(item);
        }
    }

    private writeMessage(message: MessageData) {
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
        } else {
            messageList.appendChild(div);
        }

        window.scrollTo(left, top);
    }
}