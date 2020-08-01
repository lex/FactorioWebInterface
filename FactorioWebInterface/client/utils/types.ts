export type PublicPart<T> = { [K in keyof T]: T[K] }

export type propertyOf<T> = Extract<keyof T, string>;

export function nameof<T>(name: Extract<keyof T, string>): string { return name; }