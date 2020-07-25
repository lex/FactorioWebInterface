import { ServersHubService } from "./serversHubService";
import { Result } from "../../ts/utils";
import { MessageData, FactorioControlClientData, FactorioServerStatus } from "./serversTypes";
import { ServerIdService } from "./serverIdService";
import { ObservableProperty, IObservableProperty } from "../../utils/observableProperty";
import { ObservableCollection, CircularBuffer, ObservableCircularBuffer } from "../../utils/collections/module";

export class ServerConsoleService {
    private readonly _bufferSize = 200;

    private _serverIdService: ServerIdService;
    private _serverHubService: ServersHubService;

    private _messages: ObservableCircularBuffer<MessageData>;
    private _status = new ObservableProperty<FactorioServerStatus>(FactorioServerStatus.Unknown);
    private _version = new ObservableProperty<string>('');

    get messages(): ObservableCollection<MessageData> {
        return this._messages;
    }

    get status(): IObservableProperty<FactorioServerStatus> {
        return this._status;
    }

    get version(): IObservableProperty<string> {
        return this._version;
    }

    constructor(serverIdService: ServerIdService, serverHubService: ServersHubService) {
        this._serverIdService = serverIdService;
        this._serverHubService = serverHubService;

        this._messages = new ObservableCircularBuffer(new CircularBuffer(this._bufferSize));

        serverHubService.onMessage.subscribe(event => {
            if (event.ServerId !== this._serverIdService.currentServerIdValue) {
                return;
            }

            this._messages.add(event);
        });

        serverHubService.onFactorioStatusChanged.subscribe(event => {
            this._status.raise(event.newStatus);
        });

        serverHubService.onVersion.subscribe(event => {
            this._version.raise(event)
        })

        serverIdService.onClientData.subscribe((data: FactorioControlClientData) => {
            this._messages.reset(data.Messages);
            this._status.raise(data.Status);
        });

        serverIdService.currentServerId.subscribe(event => {
            this.updateVersion();
        });

        serverHubService.whenConnection(() => {
            this.updateVersion();
        });
    }

    resume(): Promise<Result> {
        return this._serverHubService.resume() as Promise<Result>;
    }

    load(directory: string, filename: string): Promise<Result> {
        return this._serverHubService.load(directory, filename) as Promise<Result>;
    }

    startScenario(scenario: string): Promise<Result> {
        return this._serverHubService.startScenario(scenario) as Promise<Result>;
    }

    stop(): Promise<Result> {
        return this._serverHubService.stop() as Promise<Result>;
    }

    forceStop(): Promise<Result> {
        return this._serverHubService.forceStop() as Promise<Result>;
    }

    save(): Promise<Result> {
        return this._serverHubService.save() as Promise<Result>;
    }

    update(version: string): Promise<Result> {
        return this._serverHubService.update(version) as Promise<Result>;
    }

    sendMessage(message: string) {
        this._serverHubService.sendToFactorio(message);
    }

    private async updateVersion() {
        let version = await this._serverHubService.getVersion();
        this._version.raise(version);
    }
}