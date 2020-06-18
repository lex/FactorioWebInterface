export class Binding {
    constructor(target, source) {
        this.target = target;
        this.source = source;
    }
    connected() {
        this.source.connected(this.target);
        this.target.connected(this.source);
    }
    disconnected() {
        this.target.disconnected(this.source);
        this.source.disconnected(this.target);
    }
}
//# sourceMappingURL=binding.js.map