export class ComparatorHelper {
    static FromSelector(selector) {
        return ((left, right) => {
            let leftProperty = selector(left);
            let rightProperty = selector(right);
            if (leftProperty === rightProperty) {
                return 0;
            }
            else if (leftProperty > rightProperty) {
                return 1;
            }
            else {
                return -1;
            }
        });
    }
    static buildCaseSensitiveStringComparatorForProperty(property) {
        return ComparatorHelper.FromSelector((object) => object[property] + '');
    }
    static buildCaseSensitiveStringComparator() {
        return ComparatorHelper.FromSelector((object) => object + '');
    }
    static buildCaseInsensitiveStringComparatorForProperty(property) {
        return ComparatorHelper.FromSelector((object) => (object[property] + '').toLowerCase());
    }
    static buildCaseInsensitiveStringComparator() {
        return ComparatorHelper.FromSelector((object) => (object + '').toLowerCase());
    }
    static buildStringComparatorForProperty(property, caseSensitive) {
        if (caseSensitive) {
            return ComparatorHelper.buildCaseSensitiveStringComparatorForProperty(property);
        }
        else {
            return ComparatorHelper.buildCaseInsensitiveStringComparatorForProperty(property);
        }
    }
    static buildStringComparator(caseSensitive) {
        if (caseSensitive) {
            return ComparatorHelper.buildCaseSensitiveStringComparator();
        }
        else {
            return ComparatorHelper.buildCaseInsensitiveStringComparator();
        }
    }
}
//# sourceMappingURL=comparatorHelper.js.map