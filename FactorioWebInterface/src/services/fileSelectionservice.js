var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export class FileSelectionService {
    getFiles(fileTypes) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => {
                let input = document.createElement('input');
                input.type = 'file';
                input.multiple = true;
                if (fileTypes) {
                    input.accept = fileTypes;
                }
                let resolved = false;
                let focusHandler;
                let changeHandler = (() => {
                    if (resolved) {
                        return;
                    }
                    resolved = true;
                    let files = [...input.files];
                    input.value = '';
                    input.removeEventListener('change', changeHandler);
                    window.removeEventListener('focus', focusHandler);
                    resolve(files);
                });
                focusHandler = (() => {
                    setTimeout(changeHandler, 200);
                });
                window.addEventListener('focus', focusHandler);
                input.addEventListener('change', changeHandler);
                input.click();
            });
        });
    }
}
//# sourceMappingURL=fileSelectionservice.js.map