import { CollectionView } from "../../utils/collectionView";
import { ObservableObject } from "../../utils/observableObject";
export class ScenariosViewModel extends ObservableObject {
    constructor(scenarios) {
        super();
        this._sourceScenarios = scenarios;
        this._scenarios = new CollectionView(scenarios);
        this._scenarios.sortBy({ property: 'LastModifiedTime', ascending: false });
        this.updateHeader();
        this.scenarios.subscribe(() => this.updateHeader());
    }
    get header() {
        return this._header;
    }
    get scenarios() {
        return this._scenarios;
    }
    updateHeader() {
        let newCount = this._sourceScenarios.count;
        if (this._count === newCount) {
            return;
        }
        this._count = newCount;
        this._header = `Scenarios (${newCount})`;
        this.raise('header', this._header);
    }
}
//# sourceMappingURL=scenariosViewModel.js.map