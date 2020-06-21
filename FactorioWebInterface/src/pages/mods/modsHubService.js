var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as signalR from "@microsoft/signalr";
import { MessagePackHubProtocol } from "@microsoft/signalr-protocol-msgpack";
import { Observable } from "../../utils/observable";
export class ModsHubService {
    constructor() {
        this._whenConnection = new Observable();
        this._onSendModPacks = new Observable();
        this._onSendModPackFiles = new Observable();
        this._onEndDownloadFromModPortal = new Observable();
        this._connection = new signalR.HubConnectionBuilder()
            .withUrl('/factorioModHub')
            .withHubProtocol(new MessagePackHubProtocol())
            .build();
        this._connection.on('SendModPacks', (data) => {
            this._onSendModPacks.raise(data);
        });
        this._connection.on('SendModPackFiles', (modPack, data) => {
            this._onSendModPackFiles.raise({ modPack, data });
        });
        this._connection.on('EndDownloadFromModPortal', (result) => {
            this._onEndDownloadFromModPortal.raise(result);
        });
        this._connection.onclose(() => __awaiter(this, void 0, void 0, function* () {
            yield this.startConnection();
        }));
        this.startConnection();
    }
    get onSendModPacks() {
        return this._onSendModPacks;
    }
    get onSendModPackFiles() {
        return this._onSendModPackFiles;
    }
    get onEndDownloadFromModPortal() {
        return this._onEndDownloadFromModPortal;
    }
    whenConnection(callback) {
        if (this._connection.state === signalR.HubConnectionState.Connected) {
            callback();
        }
        return this._whenConnection.subscribe(callback);
    }
    requestModPacks() {
        this._connection.send('RequestModPacks');
    }
    requestModPackFiles(modPack) {
        this._connection.send('RequestModPackFiles', modPack);
    }
    deleteModPack(modPack) {
        return this._connection.invoke('DeleteModPack', modPack);
    }
    deleteModPackFiles(modPack, fileNames) {
        return this._connection.invoke('DeleteModPackFiles', modPack, fileNames);
    }
    createModPack(name) {
        return this._connection.invoke('CreateModPack', name);
    }
    renameModPack(oldName, newName) {
        return this._connection.invoke('RenameModPack', oldName, newName);
    }
    copyModPackFiles(modPack, targetModPack, fileNames) {
        return this._connection.invoke('CopyModPackFiles', modPack, targetModPack, fileNames);
    }
    moveModPackFiles(modPack, targetModPack, fileNames) {
        return this._connection.invoke('MoveModPackFiles', modPack, targetModPack, fileNames);
    }
    downloadFromModPortal(modPack, fileNames) {
        this._connection.send('DownloadFromModPortal', modPack, fileNames);
    }
    startConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this._connection.start();
                this._whenConnection.raise();
            }
            catch (ex) {
                console.log(ex);
                setTimeout(() => this.startConnection(), 2000);
            }
        });
    }
}
//# sourceMappingURL=modsHubService.js.map