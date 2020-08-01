export class ArrayHelper {
    static remove<T>(array: T[], item: T): boolean {
        let index = array.indexOf(item);

        if (index >= 0) {
            array.splice(index, 1);
            return true;
        }

        return false;
    }

    static copy<T>(source: T[], sourceIndex: number, target: T[], targetIndex: number, length: number): void {
        for (let i = 0; i < length; i++) {
            target[targetIndex + i] = source[sourceIndex + i];
        }
    }
}