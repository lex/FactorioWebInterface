export class ArrayHelper {
    static remove<T>(array: T[], item: T): boolean {
        const index = array.indexOf(item);

        if (index >= 0) {
            array.splice(index, 1);
            return true;
        }

        return false;
    }

    static replace<T>(array: T[], oldItem: T, newItem: T): boolean {
        for (let i = 0; i < array.length; i++) {
            const item = array[i];

            if (item === oldItem) {
                array[i] = newItem
                return true;
            }
        }

        return false;
    }

    static copy<T>(source: T[], sourceIndex: number, target: T[], targetIndex: number, length: number): void {
        for (let i = 0; i < length; i++) {
            target[targetIndex + i] = source[sourceIndex + i];
        }
    }
}