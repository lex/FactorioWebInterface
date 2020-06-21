export class EventListener {
    static onChange(element: Node, handler: (event?: Event) => void): () => void {
        element.addEventListener('change', handler);

        return () => element.removeEventListener('change', handler);
    }

    static onClick(element: Node, handler: (event?: MouseEvent) => void): () => void {
        element.addEventListener('click', handler);

        return () => element.removeEventListener('click', handler);
    }

    static onMouseDown(element: Node, handler: (event?: MouseEvent) => void): () => void {
        element.addEventListener('mousedown', handler);

        return () => element.removeEventListener('mousedown', handler);
    }

    static onKeyUp(element: Node, handler: (event?: KeyboardEvent) => void): () => void {
        element.addEventListener('keyup', handler);

        return () => element.removeEventListener('keyup', handler);
    }

    static onMouseEnter(element: HTMLElement, handler: (event?: MouseEvent) => void): () => void {
        element.addEventListener('mouseenter', handler);

        return () => element.removeEventListener('mouseenter', handler);
    }

    static onMouseLeave(element: HTMLElement, handler: (event?: MouseEvent) => void): () => void {
        element.addEventListener('mouseleave', handler);

        return () => element.removeEventListener('mouseleave', handler);
    }
}