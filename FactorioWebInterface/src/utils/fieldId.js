export class FieldId {
    static getNextId() {
        return 'field' + FieldId.count++;
    }
}
FieldId.count = 1;
//# sourceMappingURL=fieldId.js.map