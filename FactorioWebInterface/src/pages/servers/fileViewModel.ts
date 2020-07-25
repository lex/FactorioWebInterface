import { FileMetaData } from "./serversTypes";
import { IObservableProperty } from "../../utils/observableProperty";
import { ObservableObject } from "../../utils/observableObject";
import { ObservableCollection, CollectionView } from "../../utils/collections/module";

export class FileViewModel extends ObservableObject {
    private _sourceFiles: ObservableCollection<FileMetaData>;
    private _tableName: string;
    private _prevCount: number;

    private _header: string;
    private _files: CollectionView<FileMetaData>;
    private _serverId: IObservableProperty<string>;

    get header() {
        return this._header;
    }

    get files() {
        return this._files;
    }

    get serverId() {
        return this._serverId;
    }

    get count(): number {
        return this._sourceFiles.count;
    }

    constructor(tableName: string, files: ObservableCollection<FileMetaData>, serverId: IObservableProperty<string>) {
        super();

        this._tableName = tableName;
        this._sourceFiles = files;
        this._files = new CollectionView(files);
        this._files.sortBy({ property: 'LastModifiedTime', ascending: false });
        this._serverId = serverId;

        this.updateHeader();
        this.files.subscribe(() => this.updateHeader());
    }

    private updateHeader() {
        let newCount = this.count;

        if (this._prevCount === newCount) {
            return;
        }

        this._prevCount = newCount;

        this._header = `${this._tableName} (${newCount})`;
        this.raise('header', this._header);
    }
}