import { Tooltip } from "../components/tooltip";
import { EventListener } from "../utils/eventListener";
export class TooltipService {
    static removeLastTooltip() {
        if (TooltipService._lastTooltip == null) {
            return;
        }
        TooltipService._lastTooltip.remove();
        TooltipService._lastTooltip = undefined;
    }
    static showTooltip(parent, tooltip) {
        TooltipService.removeLastTooltip();
        if (tooltip == null) {
            return;
        }
        let t = Tooltip.toTooltip(tooltip);
        let pos = parent.getBoundingClientRect();
        let x = (pos.left + pos.right) / 2;
        let y = pos.bottom;
        document.body.append(t);
        t.style.left = x + 'px';
        t.style.top = y + 'px';
        TooltipService._lastTooltip = t;
        return t;
    }
    static setTooltip(parent, tooltip) {
        let registeredTooltips = TooltipService._registeredTooltips;
        let info = registeredTooltips.get(parent);
        if (tooltip == null) {
            if (info == null) {
                return;
            }
            registeredTooltips.delete(parent);
            if (info.isActive) {
                info.tooltip.remove();
            }
            info.enterSubscription();
            info.leaveSubscription();
            return;
        }
        if (info == null) {
            let enterSubscription = EventListener.onMouseEnter(parent, () => {
                let newTooltip = TooltipService.showTooltip(parent, info.tooltip);
                info.tooltip = newTooltip;
                info.isActive = true;
            });
            let leaveSubscription = EventListener.onMouseLeave(parent, () => {
                if (!info.isActive) {
                    return;
                }
                info.tooltip.remove();
                info.isActive = false;
            });
            info = { tooltip: tooltip, enterSubscription: enterSubscription, leaveSubscription: leaveSubscription };
            registeredTooltips.set(parent, info);
            return;
        }
        if (info.isActive) {
            info.tooltip.remove();
            let newTooltip = TooltipService.showTooltip(parent, tooltip);
            info.tooltip = newTooltip;
            return;
        }
        info.tooltip = tooltip;
    }
}
TooltipService._registeredTooltips = new WeakMap();
//# sourceMappingURL=tooltipService.js.map