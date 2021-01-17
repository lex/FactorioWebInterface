export class ComparatorHelper {
    private static readonly _latestVersion = 'latest';

    static readonly caseInsensitiveStringComparator = ComparatorHelper.buildCaseInsensitiveStringComparator();
    static readonly caseSensitiveStringComparator = ComparatorHelper.buildCaseSensitiveStringComparator();

    static FromSelector<T = any>(selector: (T) => any): (left: T, right: T) => number {
        return ((left: T, right: T) => {
            let leftProperty = selector(left);
            let rightProperty = selector(right);

            if (leftProperty === rightProperty) {
                return 0;
            } else if (leftProperty > rightProperty) {
                return 1;
            } else {
                return -1;
            }
        });
    }

    static buildCaseSensitiveStringComparatorForProperty<T = any>(property: string): (left: T, right: T) => number {
        return ComparatorHelper.FromSelector((object: T) => object[property] + '');
    }

    static buildCaseSensitiveStringComparator<T = any>(): (left: T, right: T) => number {
        return ComparatorHelper.FromSelector((object: T) => object + '');
    }

    static buildCaseInsensitiveStringComparatorForProperty<T = any>(property: string): (left: T, right: T) => number {
        return ComparatorHelper.FromSelector((object: T) => (object[property] + '').toLowerCase());
    }

    static buildCaseInsensitiveStringComparator<T = any>(): (left: T, right: T) => number {
        return ComparatorHelper.FromSelector((object: T) => (object + '').toLowerCase());
    }

    static buildStringComparatorForProperty<T = any>(property: string, caseSensitive?: boolean): (left: T, right: T) => number {
        if (caseSensitive) {
            return ComparatorHelper.buildCaseSensitiveStringComparatorForProperty(property);
        } else {
            return ComparatorHelper.buildCaseInsensitiveStringComparatorForProperty(property);
        }
    }

    static buildStringComparator<T = any>(caseSensitive?: boolean): (left: T, right: T) => number {
        if (caseSensitive) {
            return ComparatorHelper.buildCaseSensitiveStringComparator();
        } else {
            return ComparatorHelper.buildCaseInsensitiveStringComparator();
        }
    }

    static patchStringComparator(left: string, right: string) {
        if (left === right) {
            return 0;
        }

        if (left.toLowerCase() === ComparatorHelper._latestVersion) {
            return -1;
        }

        if (right.toLowerCase() === ComparatorHelper._latestVersion) {
            return 1;
        }

        let leftParts = left.split('.');
        let rightParts = right.split('.');
        return ComparatorHelper.compareParts(leftParts, rightParts);
    }

    private static compareParts(leftParts: string[], rightParts: string[]): number {
        let maxLength = Math.max(leftParts.length, rightParts.length);
        for (let i = 0; i < maxLength; i++) {
            let value = ComparatorHelper.comparePart(leftParts[i], rightParts[i]);
            if (value !== 0) {
                return value;
            }
        }

        return 0;
    }

    private static comparePart(left: string | undefined, right: string | undefined): number {
        let leftNumber = parseInt(left);
        let rightNumber = parseInt(right);

        if (isNaN(leftNumber)) {
            if (isNaN(rightNumber)) {
                return 0;
            }

            return -1;
        }

        if (isNaN(rightNumber)) {
            return 1;
        }

        return leftNumber - rightNumber;
    }
}