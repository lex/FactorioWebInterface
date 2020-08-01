import { FileMetaData } from "./serversTypes";
import { ObservableObject } from "../../utils/observableObject";
import { ObservableCollection, CollectionView } from "../../utils/collections/module";

export class LogFileViewModel extends ObservableObject {
    private _sourceFiles: ObservableCollection<FileMetaData>;
    private _tableName: string;
    private _count: number;

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

    constructor(tableName: string, files: ObservableCollection<FileMetaData>, handler: string) {
        super();

        this._tableName = tableName;
        this._sourceFiles = files;
        this._files = new CollectionView(files);
        this._files.sortBy({ property: 'LastModifiedTime', ascending: false });
        this._handler = handler;

        this.updateHeader();
        this.files.subscribe(() => this.updateHeader());
    }

    private updateHeader() {
        let newCount = this._sourceFiles.count;

        if (this._count === newCount) {
            return;
        }

        this._count = newCount;

        this._header = `${this._tableName} (${newCount})`;
        this.raise('header', this._header);
    }
}