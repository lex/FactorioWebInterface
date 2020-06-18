export class NodeHelper {
    static getByInstanceOfInner(node, type, output) {
        if (node instanceof type) {
            output.push(node);
        }
        for (let child of node.childNodes) {
            NodeHelper.getByInstanceOfInner(child, type, output);
        }
    }
    static getByInstanceOf(node, type) {
        let output = [];
        this.getByInstanceOfInner(node, type, output);
        return output;
    }
    static getNode(value) {
        if (value instanceof Node) {
            return value;
        }
        return document.createTextNode(value);
    }
    static FirstChildOfInstance(node, type) {
        for (let child of node.childNodes) {
            if (child instanceof type) {
                return child;
            }
        }
    }
}
//# sourceMappingURL=nodeHelper.js.map