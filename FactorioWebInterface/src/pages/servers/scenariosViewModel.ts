import { CollectionView } from "../../utils/collectionView";
import { ScenarioMetaData } from "./serversTypes";
import { ObservableCollection } from "../../utils/observableCollection";
import { ObservableObject } from "../../utils/observableObject";

export class ScenariosViewModel extends ObservableObject {
    private _sourceScenarios: ObservableCollection<ScenarioMetaData>;
    private _count: number;

    private _header: string;
    private _scenarios: CollectionView<ScenarioMetaData>;

    get header() {
        return this._header;
    }

    get scenarios() {
        return this._scenarios;
    }

    constructor(scenarios: ObservableCollection<ScenarioMetaData>) {
        super();

        this._sourceScenarios = scenarios;
        this._scenarios = new CollectionView(scenarios);
        this._scenarios.sortBy({ property: 'LastModifiedTime', ascending: false });

        this.updateHeader();
        this.scenarios.subscribe(() => this.updateHeader());
    }

    private updateHeader() {
        let newCount = this._sourceScenarios.count;

        if (this._count === newCount) {
            return;
        }

        this._count = newCount;

        this._header = `Scenarios (${newCount})`;
        this.raise('header', this._header);
    }
}