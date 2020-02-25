import { CollectionView } from "../../utils/collectionView";
import { ObservableObject } from "../../utils/observableObject";
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
    updateHeader() {
        let newCount = this._sourceFiles.count;
        if (this._count === newCount) {
            return;
        }
        this._count = newCount;
        this._header = `${this._tableName} (${newCount})`;
        this.raise('header', this._header);
    }
}
//# sourceMappingURL=fileViewModel.js.map