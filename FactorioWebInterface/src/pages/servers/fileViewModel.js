import { ObservableObject } from "../../utils/observableObject";
import { CollectionView } from "../../utils/collections/module";
export class FileViewModel extends ObservableObject {
    constructor(tableName, files, serverId) {
        super();
        this._tableName = tableName;
        this._sourceFiles = files;
        this._files = new CollectionView(files);
        this._files.sortBy({ property: 'LastModifiedTime', ascending: false });
        this._serverId = serverId;
        this.updateHeader();
        this.files.subscribe(() => this.updateHeader());
    }
    get header() {
        return this._header;
    }
    get files() {
        return this._files;
    }
    get serverId() {
        return this._serverId;
    }
    get count() {
        return this._sourceFiles.count;
    }
    updateHeader() {
        let newCount = this.count;
        if (this._prevCount === newCount) {
            return;
        }
        this._prevCount = newCount;
        this._header = `${this._tableName} (${newCount})`;
        this.raise('header', this._header);
    }
}
//# sourceMappingURL=fileViewModel.js.map