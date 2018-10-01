var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as signalR from "@aspnet/signalr";
var MessageType;
(function (MessageType) {
    MessageType[MessageType["Output"] = 0] = "Output";
    MessageType[MessageType["Wrapper"] = 1] = "Wrapper";
    MessageType[MessageType["Control"] = 2] = "Control";
    MessageType[MessageType["Status"] = 3] = "Status";
    MessageType[MessageType["Discord"] = 4] = "Discord";
})(MessageType || (MessageType = {}));
const maxMessageCount = 100;
const divMessages = document.querySelector("#divMessages");
const tbMessage = document.querySelector("#tbMessage");
const btnSend = document.querySelector("#btnSend");
const serverIdInput = document.getElementById('serverIdInput');
const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const forceStopButton = document.getElementById('forceStopButton');
const getStatusButton = document.getElementById('getStatusButton');
const statusText = document.getElementById('statusText');
let messageCount = 0;
const connection = new signalR.HubConnectionBuilder()
    .withUrl("/FactorioControlHub")
    .build();
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield connection.start();
            let data = yield connection.invoke("SetServerId", serverIdInput.value);
            statusText.value = data.status;
            for (let message of data.messages) {
                writeMessage(message);
            }
        }
        catch (ex) {
            console.log(ex.message);
        }
    });
}
init();
connection.on("SendMessage", writeMessage);
connection.on('FactorioStatusChanged', (newStatus, oldStatus) => {
    console.log(`new: ${newStatus}, old: ${oldStatus}`);
    statusText.value = newStatus;
});
tbMessage.addEventListener("keyup", (e) => {
    if (e.keyCode === 13) {
        send();
    }
});
btnSend.addEventListener("click", send);
function send() {
    connection.send("SendToFactorio", tbMessage.value)
        .then(() => tbMessage.value = "");
}
startButton.onclick = () => {
    connection.invoke("Start")
        .then(() => console.log("started"));
};
stopButton.onclick = () => {
    connection.invoke("Stop")
        .then(() => console.log("stopped"));
};
forceStopButton.onclick = () => {
    connection.invoke("ForceStop")
        .then(() => console.log("force stopped"));
};
getStatusButton.onclick = () => {
    connection.invoke("GetStatus").then((data) => {
        console.log(`status: ${data}`);
        statusText.value = data;
    });
};
function writeMessage(message) {
    let div = document.createElement("div");
    let data;
    switch (message.messageType) {
        case MessageType.Output:
            data = `${message.message}`;
            break;
        case MessageType.Wrapper:
            data = `[Wrapper] ${message.message}`;
            break;
        case MessageType.Control:
            data = `[Control] ${message.message}`;
            break;
        case MessageType.Discord:
            data = `[Discord] ${message.message}`;
            break;
        case MessageType.Status:
            div.classList.add('bg-info', 'text-white');
            data = `[Status] ${message.message}`;
            break;
        default:
            data = "";
            break;
    }
    div.innerText = data;
    if (messageCount === 100) {
        let first = divMessages.firstChild;
        divMessages.removeChild(first);
    }
    else {
        messageCount++;
    }
    divMessages.appendChild(div);
    divMessages.scrollTop = divMessages.scrollHeight;
}
//# sourceMappingURL=servers.js.map