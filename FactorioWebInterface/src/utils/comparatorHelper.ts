export class ComparatorHelper {
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

}