export class NodeHelper {
    private static getByInstanceOfInner<T, TT extends Function>(node: Node, type: TT, output: T[]) {
        if (node instanceof type) {
            output.push(node as any as T);
        }

        for (let child of node.childNodes) {
            NodeHelper.getByInstanceOfInner(child, type, output);
        }
    }

    static getByInstanceOf<T, TT extends Function>(node: Node, type: TT): T[] {
        let output: T[] = [];
        this.getByInstanceOfInner(node, type, output);
        return output;
    }

    static getNode(value: Node | string) {
        if (value instanceof Node) {
            return value;
        }

        return document.createTextNode(value);
    }

    static FirstChildOfInstance<T, TT extends Function>(node: Node, type: TT): T {
        for (let child of node.childNodes) {
            if (child instanceof type) {
                return child as any as T;
            }
        }
    }
}