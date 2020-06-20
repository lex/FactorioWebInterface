import { Tooltip } from "../components/tooltip";
import { EventListener } from "../utils/eventListener";
import { TooltipBackground } from "../components/tooltipBackground";
export class TooltipService {
    static removeLastTooltip() {
        if (TooltipService._tooltipBackground == null) {
            return;
        }
        TooltipService._tooltipBackground.remove();
        TooltipService._tooltipBackground = undefined;
    }
    static showTooltip(parent, tooltip) {
        TooltipService.removeLastTooltip();
        if (tooltip == null) {
            return;
        }
        let pos = parent.getBoundingClientRect();
        let x = (pos.left + pos.right) / 2;
        let y = pos.bottom;
        let t = Tooltip.toTooltip(tooltip);
        t.style.top = y + 'px';
        let spacer = document.createElement('div');
        spacer.classList.add('spacer');
        spacer.style.flexBasis = x + 'px';
        let tooltipContainer = document.createElement('div');
        tooltipContainer.classList.add('tooltip-container');
        tooltipContainer.append(t);
        let tooltipBackground = new TooltipBackground();
        tooltipBackground.append(spacer, tooltipContainer);
        TooltipService._tooltipBackground = tooltipBackground;
        document.body.append(tooltipBackground);
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
                var _a;
                if (!info.isActive) {
                    return;
                }
                (_a = TooltipService._tooltipBackground) === null || _a === void 0 ? void 0 : _a.remove();
                info.isActive = false;
            });
            info = { tooltip: tooltip, enterSubscription: enterSubscription, leaveSubscription: leaveSubscription };
            registeredTooltips.set(parent, info);
            return;
        }
        if (info.isActive) {
            let newTooltip = TooltipService.showTooltip(parent, tooltip);
            info.tooltip = newTooltip;
            return;
        }
        info.tooltip = tooltip;
    }
}
TooltipService._registeredTooltips = new WeakMap();
//# sourceMappingURL=tooltipService.js.map