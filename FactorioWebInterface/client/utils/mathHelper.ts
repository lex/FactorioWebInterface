export class MathHelper {
    static toIntegerOrDefault(value: number, defaultValue?: number): number {
        if (isNaN(value)) {
            return defaultValue ?? 0;
        }

        return Math.floor(value);
    }

    static positiveMod(n: number, m: number) {
        return ((n % m) + m) % m;
    }
}