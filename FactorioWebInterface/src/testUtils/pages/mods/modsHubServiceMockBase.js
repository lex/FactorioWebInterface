import { InvokeBase } from "../../invokeBase";
import { Observable } from "../../../utils/observable";
export class ModsHubServiceMockBase extends InvokeBase {
    constructor() {
        super(...arguments);
        this._onConnection = new Observable();
        this._onSendModPacks = new Observable();
        this._onSendModPackFiles = new Observable();
        this._onEndDownloadFromModPortal = new Observable();
    }
    get onSendModPacks() {
        this.invoked('onSendModPacks');
        return this._onSendModPacks;
    }
    get onSendModPackFiles() {
        this.invoked('onSendModPackFiles');
        return this._onSendModPackFiles;
    }
    get onEndDownloadFromModPortal() {
        this.invoked('onEndDownloadFromModPortal');
        return this._onEndDownloadFromModPortal;
    }
    whenConnection(callback) {
        this.invoked('whenConnection');
        return this._onConnection.subscribe(callback);
    }
    requestModPacks() {
        this.invoked('requestModPacks');
    }
    requestModPackFiles(modPack) {
        this.invoked('requestModPackFiles', modPack);
    }
    deleteModPack(modPack) {
        this.invoked('deleteModPack', modPack);
        return Promise.resolve({ Success: true });
    }
    deleteModPackFiles(modPack, fileNames) {
        this.invoked('deleteModPackFiles', modPack, fileNames);
        return Promise.resolve({ Success: true });
    }
    createModPack(name) {
        this.invoked('createModPack', name);
        return Promise.resolve({ Success: true });
    }
    renameModPack(oldName, newName) {
        this.invoked('renameModPack', oldName, newName);
        return Promise.resolve({ Success: true });
    }
    copyModPackFiles(modPack, targetModPack, fileNames) {
        this.invoked('copyModPackFiles', modPack, targetModPack, fileNames);
        return Promise.resolve({ Success: true });
    }
    moveModPackFiles(modPack, targetModPack, fileNames) {
        this.invoked('moveModPackFiles', modPack, targetModPack, fileNames);
        return Promise.resolve({ Success: true });
    }
    downloadFromModPortal(modPack, fileNames) {
        this.invoked('downloadFromModPortal', modPack, fileNames);
    }
}
//# sourceMappingURL=modsHubServiceMockBase.js.map