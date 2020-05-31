import { FactorioServerStatus } from "./serversTypes";

export class FactorioServerStatusUtils {
    static isStartable(status: FactorioServerStatus): boolean {
        switch (status) {
            case FactorioServerStatus.Unknown:
            case FactorioServerStatus.Stopped:
            case FactorioServerStatus.Killed:
            case FactorioServerStatus.Crashed:
            case FactorioServerStatus.Updated:
            case FactorioServerStatus.Errored:
                return true;
            default:
                return false;
        }
    }

    static IsStoppable(status: FactorioServerStatus): boolean {
        switch (status) {
            case FactorioServerStatus.WrapperStarted:
            case FactorioServerStatus.Starting:
            case FactorioServerStatus.Running:
                return true;
            default:
                return false;
        }
    }

    static IsForceStoppable(status: FactorioServerStatus): boolean {
        switch (status) {
            case FactorioServerStatus.Unknown:
            case FactorioServerStatus.WrapperStarted:
            case FactorioServerStatus.Starting:
            case FactorioServerStatus.Running:
                return true;
            default:
                return false;
        }
    }

    static IsUpdatable(status: FactorioServerStatus): boolean {
        switch (status) {
            case FactorioServerStatus.Unknown:
            case FactorioServerStatus.Stopped:
            case FactorioServerStatus.Killed:
            case FactorioServerStatus.Crashed:
            case FactorioServerStatus.Updated:
            case FactorioServerStatus.Errored:
                return true;
            default:
                return false;
        }
    }

    static HasFinishedRunning(status: FactorioServerStatus): boolean {
        switch (status) {
            case FactorioServerStatus.Stopped:
            case FactorioServerStatus.Killed:
            case FactorioServerStatus.Crashed:
                return true;
            default:
                return false;
        }
    }
}