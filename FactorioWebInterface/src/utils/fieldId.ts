export class FieldId {
    private static count: number = 1;

    static getNextId(): string {
        return 'field' + FieldId.count++;
    }
}