import { InvokeBase } from "../invokeBase";
import { IHiddenInputService } from "../../services/iHiddenInputService";
import { PublicPart } from "../../utils/types";

export class HiddenInputServiceMockBase extends InvokeBase<IHiddenInputService> implements PublicPart<IHiddenInputService>{
    _map = new Map<string, string>();


    constructor(strict: boolean = false) {
        super(strict);

        this._map.set('serverSelected', '1');
        this._map.set('serverCount', '10');
        this._map.set('__username', 'username');
    }

    getValue(name: string): string {
        this.invoked('getValue');
        return this._map.get(name);
    }
}