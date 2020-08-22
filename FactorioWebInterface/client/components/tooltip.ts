import "./tooltip.ts.less";
import { ContentBase } from "./contentBase";

export class Tooltip extends ContentBase {
    static toTooltip(value: string | Node | Tooltip): Tooltip {
        if (value instanceof Tooltip) {
            return value;
        }

        return new Tooltip(value);
    }
}

customElements.define('a-tooltip', Tooltip);