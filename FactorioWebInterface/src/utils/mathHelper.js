export class MathHelper {
    static toIntegerOrDefault(value, defaultValue) {
        if (isNaN(value)) {
            return defaultValue !== null && defaultValue !== void 0 ? defaultValue : 0;
        }
        return Math.floor(value);
    }
    static positiveMod(n, m) {
        return ((n % m) + m) % m;
    }
}
//# sourceMappingURL=mathHelper.js.map