import { ServersHubService } from "./serversHubService";
import { Result } from "../../ts/utils";
import { ObservableKeyArray, ObservableCollection } from "../../utils/collections/module";

export class ManageVersionService {
    static readonly latestVersion = 'latest';

    private _serversHubService: ServersHubService;

    private _downloadableVersions = new ObservableKeyArray<string, string>(x => x);
    private _cachedVersions = new ObservableKeyArray<string, string>(x => x);

    get downloadableVersions(): ObservableCollection<string> {
        return this._downloadableVersions;
    }

    get cachedVersions(): ObservableCollection<string> {
        return this._cachedVersions;
    }

    constructor(serversHubService: ServersHubService) {
        this._serversHubService = serversHubService;

        this.resetDownloadableVersions();

        serversHubService.onCachedVersions.subscribe(event => this._cachedVersions.update(event));
        serversHubService.onDownloadableVersions.subscribe(event => this.resetDownloadableVersions(...event));
        //serversHubService.whenConnection(() => serversHubService.requestCachedVersions());
    }

    requestDownloadableVersion(): void {
        this._serversHubService.requestDownloadableVersions();
    }

    update(version: string): Promise<Result> {
        return this._serversHubService.update(version);
    }

    deleteCachedVersion(version: string): void {
        this._serversHubService.deleteCachedVersion(version);
    }

    requestCachedVersions(): void {
        this._serversHubService.requestCachedVersions();
    }

    private resetDownloadableVersions(...versions: string[]) {
        this._downloadableVersions.reset(...versions, ManageVersionService.latestVersion);
    }
}