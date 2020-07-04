var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { ObservableCircularBuffer } from "../../utils/observableCircularBuffer";
import { FactorioServerStatus } from "./serversTypes";
import { CircularBuffer } from "../../utils/circularBuffer";
import { ObservableProperty } from "../../utils/observableProperty";
export class ServerConsoleService {
    constructor(serverIdService, serverHubService) {
        this._bufferSize = 200;
        this._status = new ObservableProperty(FactorioServerStatus.Unknown);
        this._version = new ObservableProperty('');
        this._serverIdService = serverIdService;
        this._serverHubService = serverHubService;
        this._messages = new ObservableCircularBuffer(new CircularBuffer(this._bufferSize));
        serverHubService.onMessage.subscribe(event => {
            if (event.ServerId !== this._serverIdService.currentServerIdValue) {
                return;
            }
            this._messages.add(event);
        });
        serverHubService.onFactorioStatusChanged.subscribe(event => {
            this._status.raise(event.newStatus);
        });
        serverHubService.onVersion.subscribe(event => {
            this._version.raise(event);
        });
        serverIdService.onClientData.subscribe((data) => {
            this._messages.reset(data.Messages);
            this._status.raise(data.Status);
        });
        serverIdService.currentServerId.subscribe(event => {
            this.updateVersion();
        });
        serverHubService.whenConnection(() => {
            this.updateVersion();
        });
    }
    get messages() {
        return this._messages;
    }
    get status() {
        return this._status;
    }
    get version() {
        return this._version;
    }
    resume() {
        return this._serverHubService.resume();
    }
    load(directory, filename) {
        return this._serverHubService.load(directory, filename);
    }
    startScenario(scenario) {
        return this._serverHubService.startScenario(scenario);
    }
    stop() {
        return this._serverHubService.stop();
    }
    forceStop() {
        return this._serverHubService.forceStop();
    }
    save() {
        return this._serverHubService.save();
    }
    update(version) {
        return this._serverHubService.update(version);
    }
    sendMessage(message) {
        this._serverHubService.sendToFactorio(message);
    }
    updateVersion() {
        return __awaiter(this, void 0, void 0, function* () {
            let version = yield this._serverHubService.getVersion();
            this._version.raise(version);
        });
    }
}
//# sourceMappingURL=serverConsoleService.js.map