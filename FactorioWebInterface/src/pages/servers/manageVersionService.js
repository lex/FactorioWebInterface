import { ObservableKeyArray } from "../../utils/observableCollection";
export class ManageVersionService {
    constructor(serversHubService) {
        this._downloadableVersions = new ObservableKeyArray(x => x);
        this._cachedVersions = new ObservableKeyArray(x => x);
        this._serversHubService = serversHubService;
        this.resetDownloadableVersions();
        serversHubService.onCachedVersions.subscribe(event => this._cachedVersions.update(event));
        serversHubService.onDownloadableVersions.subscribe(event => this.resetDownloadableVersions(...event));
        //serversHubService.whenConnection(() => serversHubService.requestCachedVersions());
    }
    get downloadableVersions() {
        return this._downloadableVersions;
    }
    get cachedVersions() {
        return this._cachedVersions;
    }
    requestDownloadableVersion() {
        this._serversHubService.requestDownloadableVersions();
    }
    update(version) {
        return this._serversHubService.update(version);
    }
    deleteCachedVersion(version) {
        this._serversHubService.deleteCachedVersion(version);
    }
    requestCachedVersions() {
        this._serversHubService.requestCachedVersions();
    }
    resetDownloadableVersions(...versions) {
        this._downloadableVersions.reset(...versions, ManageVersionService.latestVersion);
    }
}
ManageVersionService.latestVersion = 'latest';
//# sourceMappingURL=manageVersionService.js.map