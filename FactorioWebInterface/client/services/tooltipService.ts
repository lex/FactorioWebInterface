import { Tooltip } from "../components/tooltip";
import { EventListener } from "../utils/eventListener";
import { TooltipBackground } from "../components/tooltipBackground";

interface TooltipInfo {
    isActive?: boolean;
    tooltip: string | Node | Tooltip;
    enterSubscription: () => void;
    leaveSubscription: () => void;
}

export class TooltipService {
    private static _tooltipBackground: TooltipBackground;

    private static _registeredTooltips = new WeakMap<HTMLElement, TooltipInfo>();

    private static removeLastTooltip() {
        if (TooltipService._tooltipBackground == null) {
            return;
        }

        TooltipService._tooltipBackground.remove();
        TooltipService._tooltipBackground = undefined;
    }

    static showTooltip(parent: HTMLElement, tooltip: string | Node | Tooltip): Tooltip {
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

    static setTooltip(parent: HTMLElement, tooltip: string | Node | Tooltip): void {
        let registeredTooltips = TooltipService._registeredTooltips;

        let info = registeredTooltips.get(parent);

        if (tooltip == null) {
            if (info == null) {
                return;
            }

            registeredTooltips.delete(parent);
            if (info.isActive) {
                (info.tooltip as Tooltip).remove();
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

                TooltipService._tooltipBackground?.remove();
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