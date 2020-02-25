export class CommandHistory {
    private _history: string[] = [];
    private _index = -1;

    write(text: string): void {
        let history = this._history;

        if (!text) {
            this.resetIndex();
            return;
        }

        if (history.length === 0) {
            history.push(text);
            this.resetIndex();
            return;
        }

        let currentIndex = this._index === -1 ? this._history.length - 1 : this._index;
        let current = history[currentIndex];
        if (text != current) {
            history.push(text);
            this.resetIndex();
            return;
        }

        history.splice(this._index, 1);
        history.push(text);
        this.resetIndex();
    }

    moveNext(): string {
        let history = this._history;

        if (history.length === 0) {
            return undefined;
        }

        let newIndex = this._index + 1;
        if (newIndex >= history.length) {
            newIndex = 0;
        }

        this._index = newIndex;
        return history[newIndex];
    }

    movePrev(): string {
        let history = this._history;

        if (history.length === 0) {
            return undefined;
        }

        let newIndex = this._index - 1;
        if (newIndex < 0) {
            newIndex = history.length - 1;
        }

        this._index = newIndex;
        return history[this._index];
    }

    resetIndex(): void {
        this._index = - 1;
    }
}