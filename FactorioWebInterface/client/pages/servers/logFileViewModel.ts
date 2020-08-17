import { FileMetaData } from "./serversTypes";
import { ObservableObject } from "../../utils/observableObject";
import { ObservableCollection, CollectionView } from "../../utils/collections/module";

export class LogFileViewModel extends ObservableObject {
    private _sourceFiles: ObservableCollection<FileMetaData>;
    private _tableName: string;

    private _header: string;
    private _files: CollectionView<FileMetaData>;
    private _handler: string;

    get header() {
        return this._header;
    }

    get files() {
        return this._files;
    }

    get handler() {
        return this._handler;
    }

    get count(): number {
        return this._sourceFiles.count;
    }

    constructor(tableName: string, files: ObservableCollection<FileMetaData>, handler: string) {
        super();

        this._tableName = tableName;
        this._sourceFiles = files;
        this._files = new CollectionView(files);
        this._files.sortBy({ property: 'LastModifiedTime', ascending: false });
        this._handler = handler;

        this.files.bind(() => this.updateHeader());
    }

    private updateHeader() {
        this._header = `${this._tableName} (${this.count})`;
        this.raise('header', this._header);
    }
}