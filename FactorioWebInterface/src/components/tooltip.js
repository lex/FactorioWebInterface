import "./tooltip.ts.less";
import { ContentBase } from "./contentBase";
export class Tooltip extends ContentBase {
    static toTooltip(value) {
        if (value instanceof Tooltip) {
            return value;
        }
        return new Tooltip(value);
    }
}
customElements.define('a-tooltip', Tooltip);
//# sourceMappingURL=tooltip.js.map