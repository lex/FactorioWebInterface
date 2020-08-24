import { ScenarioMetaData } from "./serversTypes";
import { ObservableObject } from "../../utils/observableObject";
import { ObservableCollection, CollectionView } from "../../utils/collections/module";
import { IterableHelper } from "../../utils/iterableHelper";

export class ScenariosViewModel extends ObservableObject {
    private _sourceScenarios: ObservableCollection<ScenarioMetaData>;

    private _header: string;
    private _scenarios: CollectionView<ScenarioMetaData, string>;

    get header(): string {
        return this._header;
    }

    get scenarios(): CollectionView<ScenarioMetaData, string> {
        return this._scenarios;
    }

    get count(): number {
        return this._sourceScenarios.count;
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
        let selectedCount = this._scenarios.selectedCount;
        if (selectedCount === 0) {
            this._header = `Scenarios (${this.count})`;
        } else {
            let selected = IterableHelper.firstOrDefault(this._scenarios.selected).Name;
            this._header = `Scenarios (${this.count}) - Selected: ${selected}`;
        }

        this.raise('header', this._header);
    }
}