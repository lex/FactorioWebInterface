import { FileMetaData } from "./serversTypes";
import { IObservableProperty } from "../../utils/observableProperty";
import { ObservableObject } from "../../utils/observableObject";
import { ObservableCollection, CollectionView } from "../../utils/collections/module";
import { IterableHelper } from "../../utils/iterableHelper";

export class FileViewModel extends ObservableObject {
    private _sourceFiles: ObservableCollection<FileMetaData>;
    private _tableName: string;

    private _header: string;
    private _files: CollectionView<FileMetaData, string>;
    private _serverId: IObservableProperty<string>;

    get header() {
        return this._header;
    }

    get files(): CollectionView<FileMetaData, string> {
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
        let selectedCount = this._files.selectedCount;
        if (selectedCount === 0) {
            this._header = `${this._tableName} (${this.count})`;
        } else if (selectedCount === 1) {
            let selected = IterableHelper.firstOrDefault(this._files.selected).Name;
            this._header = `${this._tableName} (${this.count}) - Selected: ${selected}`;
        } else {
            this._header = `${this._tableName} (${this.count}) - Selected: ${selectedCount} saves`;
        }

        this.raise('header', this._header);
    }
}