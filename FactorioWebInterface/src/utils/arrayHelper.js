export class ArrayHelper {
    static remove(array, item) {
        let index = array.indexOf(item);
        if (index >= 0) {
            array.splice(index, 1);
            return true;
        }
        return false;
    }
    static copy(source, sourceIndex, target, targetIndex, length) {
        for (let i = 0; i < length; i++) {
            target[targetIndex + i] = source[sourceIndex + i];
        }
    }
}
//# sourceMappingURL=arrayHelper.js.map