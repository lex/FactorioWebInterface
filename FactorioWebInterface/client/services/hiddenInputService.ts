import { IHiddenInputService } from "./iHiddenInputService";

export class HiddenInputService implements IHiddenInputService {
    private _map = new Map<string, string>();

    getValue(name: string): string {
        let map = this._map;

        let value = map.get(name);
        if (value != null) {
            return value;
        }

        let input = document.querySelector(`input[type="hidden"][name="${name}"]`) as HTMLInputElement;

        if (input == null) {
            return undefined;
        }

        value = input.value
        input.remove();

        map.set(name, value);
        return value;
    }
}