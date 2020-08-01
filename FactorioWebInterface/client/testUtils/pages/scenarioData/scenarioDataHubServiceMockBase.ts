import { InvokeBase } from "../../invokeBase";
import { ScenarioDataHubService } from "../../../pages/scenarioData/scenarioDataHubService";
import { PublicPart } from "../../../utils/types";
import { IObservable, Observable } from "../../../utils/observable";
import { CollectionChangedData } from "../../../ts/utils";
import { ScenarioData, Entry } from "../../../pages/scenarioData/scenarioData";

export class ScenarioDataHubServiceMockBase extends InvokeBase<ScenarioDataHubService> implements PublicPart<ScenarioDataHubService>{
    _onConnection = new Observable<void>();

    _onSendDataSets = new Observable<CollectionChangedData<string>>();
    _onSendEntries = new Observable<{ dataSet: string, data: CollectionChangedData<Entry> }>();

    get onSendDataSets(): IObservable<CollectionChangedData<string>> {
        this.invoked('onSendDataSets');
        return this._onSendDataSets;
    }

    get onSendEntries(): IObservable<{ dataSet: string; data: CollectionChangedData<Entry>; }> {
        this.invoked('onSendEntries');
        return this._onSendEntries;
    }

    whenConnection(callback: () => void): () => void {
        this.invoked('whenConnection', callback);
        return this._onConnection.subscribe(callback);
    }

    trackDataSet(dataSet: string): void {
        this.invoked('trackDataSet', dataSet);
    }

    requestAllDataForDataSet(dataSet: string): void {
        this.invoked('requestAllDataForDataSet', dataSet);
    }

    requestAllDataSets(): void {
        this.invoked('requestAllDataSets');
    }

    updateData(data: ScenarioData): void {
        this.invoked('updateData', data);
    }
}