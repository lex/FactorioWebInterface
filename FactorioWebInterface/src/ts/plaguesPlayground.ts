import * as signalR from "@microsoft/signalr";
import { MessagePackHubProtocol } from "@microsoft/signalr-protocol-msgpack"
import { strict } from "assert";

!function () {
    const scriptPath = document.getElementById('scriptPath') as HTMLInputElement;
    const argumentsList = document.getElementById('argumentsList') as HTMLElement;
    const startButton = document.getElementById('startButton') as HTMLButtonElement;
    const killButton = document.getElementById('killButton') as HTMLButtonElement;
    const output = document.getElementById('output') as HTMLDivElement;

    const maxMessageCount = 200;
    let messageCount = 0;

    argumentsList.oninput = function (this, e: Event) {
        let target = e.target as HTMLInputElement;
        let items = argumentsList.children;
        let lastItem = items[items.length - 1];

        let bottomInput = lastItem.firstElementChild;

        if (target === bottomInput) {
            let lastInput = MakeTagInput('');
            argumentsList.appendChild(lastInput);
        }
    }

    function MakeTagInput(value: string) {
        let listItem = document.createElement('li');
        let input = document.createElement('input');

        listItem.appendChild(input);

        input.value = value;
        input.classList.add('input');

        return listItem;
    }

    const connection = new signalR.HubConnectionBuilder()
        .withUrl("/plaguesPlaygroundHub")
        .withHubProtocol(new MessagePackHubProtocol())
        .build();

    async function start() {
        try {
            await connection.start();
        } catch (ex) {
            console.log(ex.message);
            setTimeout(() => start(), 2000);
        }
    }

    connection.onclose(async () => {
        await start();
    });

    connection.on('Send', (message: string) => {
        let div = document.createElement("div");
        div.innerText = message;

        let left = window.scrollX;
        let top = window.scrollY;

        if (messageCount === maxMessageCount) {
            let first = output.firstChild
            output.removeChild(first);
        } else {
            messageCount++;
        }

        if (output.scrollTop + output.clientHeight >= output.scrollHeight) {
            output.appendChild(div);
            output.scrollTop = output.scrollHeight;
        } else {
            output.appendChild(div);
        }

        window.scrollTo(left, top);
    });

    startButton.onclick = () => {
        let args = "";

        let items = argumentsList.children;

        let removeList: Element[] = [];

        for (var i = 0; i < items.length; i++) {
            let item = items[i];
            let input = item.firstElementChild as HTMLInputElement;

            let text = input.value;

            if (text === '') {
                removeList.push(item);
            } else {
                args += `"${input.value}" `;
            }
        }

        for (var i = 0; i < removeList.length; i++) {
            removeList[i].remove();
        }

        let lastInput = MakeTagInput('');
        argumentsList.appendChild(lastInput);

        connection.invoke('Start', scriptPath.value, args);
    };

    killButton.onclick = () => {
        connection.invoke('Kill')
    }

    start();
}();