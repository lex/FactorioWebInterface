export class EventListener {
    static onChange(element: Node, handler: (event?: Event) => void): () => void {
        element.addEventListener('change', handler);

        return () => element.removeEventListener('change', handler);
    }

    static onClick(element: Node, handler: (event?: MouseEvent) => void): () => void {
        element.addEventListener('click', handler);

        return () => element.removeEventListener('click', handler);
    }

    static onKeyUp(element: Node, handler: (event?: KeyboardEvent) => void): () => void {
        element.addEventListener('keyup', handler);

        return () => element.removeEventListener('keyup', handler);
    }
}