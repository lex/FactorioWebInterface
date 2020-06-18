export var MessageType;
(function (MessageType) {
    MessageType["Output"] = "Output";
    MessageType["Wrapper"] = "Wrapper";
    MessageType["Control"] = "Control";
    MessageType["Status"] = "Status";
    MessageType["Discord"] = "Discord";
    MessageType["Error"] = "Error";
})(MessageType || (MessageType = {}));
export var FactorioServerStatus;
(function (FactorioServerStatus) {
    FactorioServerStatus["Unknown"] = "Unknown";
    FactorioServerStatus["WrapperStarting"] = "WrapperStarting";
    FactorioServerStatus["WrapperStarted"] = "WrapperStarted";
    FactorioServerStatus["Starting"] = "Starting";
    FactorioServerStatus["Running"] = "Running";
    FactorioServerStatus["Stopping"] = "Stopping";
    FactorioServerStatus["Stopped"] = "Stopped";
    FactorioServerStatus["Killing"] = "Killing";
    FactorioServerStatus["Killed"] = "Killed";
    FactorioServerStatus["Crashed"] = "Crashed";
    FactorioServerStatus["Updating"] = "Updating";
    FactorioServerStatus["Updated"] = "Updated";
    FactorioServerStatus["Preparing"] = "Preparing";
    FactorioServerStatus["Prepared"] = "Prepared";
    FactorioServerStatus["Errored"] = "Errored";
})(FactorioServerStatus || (FactorioServerStatus = {}));
export class FileMetaData {
    static FriendlyDirectoryName(file) {
        switch (file.Directory) {
            case 'saves': return 'Temp Saves';
            case 'local_saves': return 'Local Saves';
            case 'global_saves': return 'Global Saves';
            default: return file.Directory;
        }
    }
    static defaltedName(file) {
        let name = file.Name;
        if (name.endsWith('.zip')) {
            name = name.substring(0, name.length - 4);
        }
        return name + '-deflated.zip';
    }
}
//# sourceMappingURL=serversTypes.js.map