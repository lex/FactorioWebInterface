export class HiddenInputService {
    constructor() {
        this._map = new Map();
    }
    getValue(name) {
        let map = this._map;
        let value = map.get(name);
        if (value != null) {
            return value;
        }
        let input = document.querySelector(`input[type="hidden"][name="${name}"]`);
        if (input == null) {
            return undefined;
        }
        value = input.value;
        input.remove();
        map.set(name, value);
        return value;
    }
}
//# sourceMappingURL=hiddenInputService.js.map