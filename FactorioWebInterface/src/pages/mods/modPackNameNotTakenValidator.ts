import { ValidationRule, ValidationResult } from "../../utils/validator";
import { ObservableCollection } from "../../utils/observableCollection";
import { ModPackMetaData } from "../servers/serversTypes";
import { IterableHelper } from "../../utils/iterableHelper";

export class ModPackNameNotTakenValidator<T> extends ValidationRule<T>{
    constructor(propertyName: string, modPacks: ObservableCollection<ModPackMetaData>) {
        super(propertyName, (obj: T): ValidationResult => {
            let name: string = obj[propertyName];
            let nameLowerCase = name.toLowerCase();

            if (IterableHelper.any(modPacks.values(), modPack => modPack.Name.toLowerCase() === name)) {
                return ValidationResult.error(`Mod Pack with name '${name}' already exists.`);
            }

            return ValidationResult.validResult;
        });
    }
}