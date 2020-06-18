export class EventListener {
    static onChange(element, handler) {
        element.addEventListener('change', handler);
        return () => element.removeEventListener('change', handler);
    }
    static onClick(element, handler) {
        element.addEventListener('click', handler);
        return () => element.removeEventListener('click', handler);
    }
    static onKeyUp(element, handler) {
        element.addEventListener('keyup', handler);
        return () => element.removeEventListener('keyup', handler);
    }
    static onMouseEnter(element, handler) {
        element.addEventListener('mouseenter', handler);
        return () => element.removeEventListener('mouseenter', handler);
    }
    static onMouseLeave(element, handler) {
        element.addEventListener('mouseleave', handler);
        return () => element.removeEventListener('mouseleave', handler);
    }
}
//# sourceMappingURL=eventListener.js.map